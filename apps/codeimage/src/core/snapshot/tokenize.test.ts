import assert from 'node:assert/strict';
import {test} from 'vitest';
import {draculaTheme} from '@codeimage/highlight/dracula';
import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags} from '@lezer/highlight';
import {tokenize} from './tokenize';

const textOf = (lines: Awaited<ReturnType<typeof tokenize>>) =>
  lines.map(line => line.map(span => span.text).join('')).join('\n');

test('TypeScript loads its lazy parser and applies both Dracula highlighters', async () => {
  const code = 'const count: number = 42;\nconsole.log(count);\n';
  const lines = await tokenize(code, 'typescript', draculaTheme);
  assert.equal(textOf(lines), code);
  assert.equal(lines.length, 3);
  for (const token of ['const', 'count', 'number', '42']) {
    assert.ok(lines.flat().find(span => span.text === token)?.classes, token);
  }
  assert.notEqual(
    lines[0].find(span => span.text === 'count')?.classes,
    lines[0].find(span => span.text === 'const')?.classes,
  );
});

test('Python highlights on the first call and preserves tabs and empty lines', async () => {
  const code = 'def hello(name):\n\treturn "Hi " + name\n\n';
  const lines = await tokenize(code, 'python', draculaTheme);
  assert.equal(textOf(lines), code);
  assert.equal(lines.length, 4);
  assert.ok(lines[0].find(span => span.text === 'def')?.classes);
  assert.ok(lines[1].some(span => span.classes && span.text.includes('Hi')));
});

test('an unknown language preserves plain text, Unicode, and trailing lines', async () => {
  const code = '<unknown>\t你好 👋\n\n';
  const lines = await tokenize(code, 'not-a-language', draculaTheme);
  assert.equal(textOf(lines), code);
  assert.ok(lines.flat().every(span => span.classes === ''));
});

test('a tab name picks the parser the canvas editor uses', async () => {
  const sfc =
    '<template>\n  <p>{{ count }}</p>\n</template>\n<script setup>\nconst count = 1;\n</script>';
  const vue = await tokenize(sfc, 'typescript', draculaTheme, 'App.vue');
  assert.deepEqual(vue, await tokenize(sfc, 'html', draculaTheme));
  assert.notDeepEqual(vue, await tokenize(sfc, 'typescript', draculaTheme));
});

test('empty documents and CRLF use the same lines as CodeMirror', async () => {
  assert.deepEqual(await tokenize('', 'typescript', draculaTheme), [[]]);
  assert.equal(
    textOf(await tokenize('a\r\nb\r\n', 'typescript', draculaTheme)),
    'a\nb\n',
  );
});

test('parses every line beyond the editor viewport', async () => {
  const code = Array.from(
    {length: 300},
    (_, n) => `const value${n} = ${n};`,
  ).join('\n');
  const lines = await tokenize(code, 'typescript', draculaTheme);
  assert.equal(lines.length, 300);
  assert.equal(textOf(lines), code);
  assert.ok(lines[299].find(span => span.text === 'const')?.classes);
});

test('uses every HighlightStyle in nested theme extensions', async () => {
  const keywords = HighlightStyle.define([
    {tag: tags.keyword, color: '#ff0000'},
  ]);
  const numbers = HighlightStyle.define([{tag: tags.number, color: '#00ff00'}]);
  const lines = await tokenize('const value = 42;', 'typescript', {
    ...draculaTheme,
    editorTheme: [syntaxHighlighting(keywords), [syntaxHighlighting(numbers)]],
  });
  assert.equal(
    lines[0].find(span => span.text === 'const')?.classes,
    keywords.style([tags.keyword]),
  );
  assert.equal(
    lines[0].find(span => span.text === '42')?.classes,
    numbers.style([tags.number]),
  );
});
