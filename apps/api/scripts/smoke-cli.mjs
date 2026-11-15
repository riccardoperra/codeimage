import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';

const {scripts} = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url)),
);
const command = scripts['start:railway'];
assert.match(command, /\s--options(?:\s|$)/);
const child = spawn('sh', ['-c', `exec ${command} --port=0`], {
  cwd: new URL('..', import.meta.url),
  env: {
    ...process.env,
    MOCK_AUTH: 'true',
    MOCK_AUTH_EMAIL: 'cli-smoke@example.it',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const exited = once(child, 'exit');
let output = '';
child.stdout.on('data', chunk => {
  output += chunk;
});
child.stderr.on('data', chunk => {
  output += chunk;
});

try {
  const deadline = Date.now() + 30_000;
  let address;
  while (!address && Date.now() < deadline) {
    assert.equal(child.exitCode, null, output);
    address = output.match(
      /Server listening at (http:\/\/127\.0\.0\.1:\d+)/,
    )?.[1];
    if (!address) await delay(50);
  }
  assert.ok(address, `CLI did not listen within 30 seconds. ${output}`);
  const health = await fetch(`${address}/health`, {
    headers: {'request-id': 'invalid request id'},
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(health.status, 200);
  assert.match(
    health.headers.get('request-id'),
    /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i,
  );
  console.log(
    '/health -> 200; exported genReqId replaced an unsafe request-id with a UUID',
  );

  const projects = await fetch(`${address}/api/v1/project`, {
    headers: {'request-id': 'cli-smoke'},
    signal: AbortSignal.timeout(5_000),
  });
  assert.equal(projects.status, 200);
  assert.equal(projects.headers.get('request-id'), 'cli-smoke');
  assert.ok(Array.isArray(await projects.json()));
  console.log(
    '/api/v1/project -> 200 with mock auth and the supplied safe request-id',
  );

  child.kill('SIGTERM');
  const [code, signal] = await Promise.race([
    exited,
    delay(10_000, null, {ref: false}).then(() => {
      throw new Error('CLI did not exit after SIGTERM');
    }),
  ]);
  assert.equal(signal, null, output);
  assert.equal(code, 0, output);
  console.log('SIGTERM -> exit 0');
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await exited;
  }
}
