import assert from 'node:assert/strict';
import {test} from 'node:test';
import {detectSecrets, redactSecrets, shannonEntropy} from '../src/detect.js';
import {rules} from '../src/rules.js';

const fake = 'FakeOnly0123456789AbCdEfGhIjKlMnOpQrSt';
const fill = (length: number) =>
  fake.repeat(Math.ceil(length / fake.length)).slice(0, length);
const examples = [
  ['github-pat', `ghp_${fill(36)}`, `ghp_${fill(35)}`],
  [
    'github-fine-grained-pat',
    `github_pat_${fill(82)}`,
    `github_pat_${fill(81)}`,
  ],
  ['github-oauth', `gho_${fill(36)}`, `gho_${fill(35)}`],
  ['github-app-token', `ghs_${fill(36)}`, `ghs_${fill(35)}`],
  ['aws-access-token', 'AKIAFAKEONLYABCDEFGH', 'AKIAFAKEONLYABCDEFG1'],
  ['stripe-access-token', `sk_live_${fill(24)}`, `pk_live_${fill(24)}`],
  [
    'slack-bot-token',
    `xoxb-1234567890-1234567890-${fill(24)}`,
    `xoxb-123456789-1234567890-${fill(24)}`,
  ],
  [
    'slack-user-token',
    `xoxp-1234567890-1234567890-1234567890-${fill(32)}`,
    `xoxp-123456789-1234567890-1234567890-${fill(32)}`,
  ],
  [
    'openai-api-key',
    `sk-${fill(20)}T3BlbkFJ${fill(20)}`,
    `sk-${fill(19)}T3BlbkFJ${fill(20)}`,
  ],
  [
    'anthropic-api-key',
    `sk-ant-api03-${fill(93)}AA`,
    `sk-ant-api03-${fill(92)}AA`,
  ],
  ['gcp-api-key', `AIza${fill(35)}`, `AIza${fill(34)}`],
  [
    'jwt',
    `ey${fill(20)}.ey${fill(20)}.${fill(12)}`,
    `ey${fill(16)}.ey${fill(20)}.${fill(12)}`,
  ],
  [
    'private-key',
    `-----BEGIN RSA PRIVATE KEY-----\n${fill(80)}\n-----END RSA PRIVATE KEY-----`,
    `-----BEGIN PUBLIC KEY-----\n${fill(80)}\n-----END PUBLIC KEY-----`,
  ],
  [
    'connection-url-password',
    'postgres://user:FakePassword123!@localhost/db',
    'postgres://user@localhost/db',
  ],
  [
    'generic-assignment',
    'const MY_SECRET = "FakeOnly012345!"',
    'const MY_VALUE = "FakeOnly012345!"',
  ],
];

test('every rule has a positive and a near miss', () => {
  assert.deepEqual(
    examples.map(([id]) => id).sort(),
    rules.map(rule => rule.id).sort(),
  );
});

for (const [id, positive, negative] of examples) {
  test(`${id}: positive, near miss, stable repeated scans and redaction`, () => {
    const matches = detectSecrets(positive);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].ruleId, id);
    assert.deepEqual(detectSecrets(positive), matches);
    assert.deepEqual(detectSecrets(negative), []);
    const redacted = redactSecrets(positive);
    assert.equal(redacted.length, positive.length);
    assert.deepEqual(detectSecrets(redacted), []);
    assert.equal(
      redacted.slice(matches[0].from, matches[0].from + matches[0].keepPrefix),
      positive.slice(matches[0].from, matches[0].from + matches[0].keepPrefix),
    );
  });
}

for (const placeholder of [
  'xxxxxxxxxxxxxxxx',
  'your-secret-value123',
  '<FakeSecret123456>',
  'changeme-12345678',
  'example-secret1234',
  'process.env.MY_SECRET',
  '${MY_SECRET_VALUE}',
  'YOUR_API_KEY_1234',
]) {
  test(`skips placeholder ${placeholder}`, () => {
    assert.deepEqual(detectSecrets(`API_KEY="${placeholder}"`), []);
    assert.deepEqual(detectSecrets(`API_KEY=${placeholder}`), []);
  });
}

test('entropy threshold and minimum length', () => {
  assert.equal(shannonEntropy('😀😁😂😃'), 2);
  assert.equal(shannonEntropy(''), 0);
  const below = 'aabcdefghi12';
  const above = 'abcdefghij12';
  assert.ok(shannonEntropy(below) < 3.5);
  assert.ok(shannonEntropy(above) > 3.5);
  assert.deepEqual(detectSecrets(`PASSWORD=${below}`), []);
  assert.equal(detectSecrets(`PASSWORD=${above}`).length, 1);
  assert.deepEqual(detectSecrets('PASSWORD=abcdefgh123'), []);
  assert.equal(shannonEntropy('aabbccdd12345678'), 3.5);
  assert.equal(detectSecrets('PASSWORD=aabbccdd12345678').length, 1);
});

test('generic names, literal delimiters and env assignments', () => {
  for (const name of [
    'secret',
    'token',
    'password',
    'passwd',
    'api_key',
    'apikey',
    'private_key',
    'client_secret',
  ]) {
    for (const quote of ['"', "'", '`']) {
      assert.equal(
        detectSecrets(
          `const MY_${name.toUpperCase()} = ${quote}FakeOnly012345!${quote};`,
        ).length,
        1,
      );
    }
    assert.equal(
      detectSecrets(`export ${name}=FakeOnly012345! # example`).length,
      1,
    );
  }
  assert.deepEqual(detectSecrets('const token = referenceToSomeVariable;'), []);
  assert.deepEqual(detectSecrets('secret: referenceToSomeVariable'), []);
});

test('UTF-16 offsets, duplicate occurrences, provider priority and password-only masking', () => {
  const token = `ghp_${fill(36)}`;
  const input = `😀 const token = "${token}";\n${token}`;
  const matches = detectSecrets(input);
  assert.equal(matches.length, 2);
  assert.ok(matches.every(match => match.ruleId === 'github-pat'));
  assert.equal(input.slice(matches[0].from, matches[0].to), token);
  assert.equal(
    redactSecrets(
      'DATABASE_PASSWORD="postgres://user:FakePassword123!@localhost/db"',
    ),
    `DATABASE_PASSWORD="postgres://user:${'•'.repeat(16)}@localhost/db"`,
  );
});

test('plain UUIDs and git SHAs do not trigger warnings', () => {
  assert.deepEqual(
    detectSecrets(
      'd9428888-122b-11e1-b85c-61cd3cbb3210\n27b185f1abcde012345678901234567890abcdef123',
    ),
    [],
  );
});

test('provider variants keep their whole public prefix', () => {
  for (const prefix of ['sk-proj-', 'sk-svcacct-', 'sk-admin-']) {
    for (const length of [58, 74]) {
      const value = `${prefix}${fill(length)}T3BlbkFJ${fill(length)}`;
      assert.equal(detectSecrets(value)[0]?.keepPrefix, prefix.length);
      assert.equal(
        redactSecrets(value),
        prefix + '•'.repeat(value.length - prefix.length),
      );
    }
  }
  for (const prefix of ['sk_live_', 'sk_test_', 'rk_prod_']) {
    const value = prefix + fill(24);
    assert.equal(redactSecrets(value), prefix + '•'.repeat(24));
  }
  assert.equal(detectSecrets(`ghu_${fill(36)}`)[0]?.ruleId, 'github-app-token');
});

test('PEM redaction preserves line breaks and masks the full block', () => {
  const input = `-----BEGIN PRIVATE KEY-----\r\n${fill(80)}\r\n-----END PRIVATE KEY-----`;
  assert.equal(redactSecrets(input), input.replace(/[^\r\n]/g, '•'));
});

test('escaped quotes inside a literal are part of the secret', () => {
  const value = 'FakeOnly012345\\"stillSecret';
  const input = `const password = "${value}";`;
  const [match] = detectSecrets(input);
  assert.equal(input.slice(match.from, match.to), value);
  assert.equal(
    redactSecrets(input),
    `const password = "${'•'.repeat(value.length)}";`,
  );
});
