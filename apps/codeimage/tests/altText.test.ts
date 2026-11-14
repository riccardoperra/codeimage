import assert from 'node:assert/strict';
import {test} from 'node:test';
import {altText} from '../src/core/altText';

const tab = {
  code: 'const x = 1;',
  tab: {tabName: 'user.ts'},
  languageId: 'typescript',
  lineNumberStart: 1,
};
test('short snippet and line range', () => {
  assert.equal(
    altText({...tab, code: 'a\nb\nc\nd\ne\nf'}),
    'Typescript code, user.ts, lines 1 to 6\n\na\nb\nc\nd\ne\nf',
  );
  assert.match(
    altText({...tab, code: Array(8).fill('x').join('\n'), lineNumberStart: 5}),
    /lines 5 to 12/,
  );
});
test('unnamed tab', () => {
  assert.equal(
    altText({...tab, tab: {tabName: ''}}),
    'Typescript code, lines 1 to 1\n\nconst x = 1;',
  );
});
test('long snippet is limited including note', () => {
  const result = altText({...tab, code: 'x'.repeat(2000)});
  assert.equal(Array.from(result).length, 1000);
  assert.ok(result.endsWith('\n[Code truncated]'));
});
test('emoji and CJK survive the cut', () => {
  const result = altText({...tab, code: '😀漢字'.repeat(1000)});
  assert.equal(Array.from(result).length, 1000);
  assert.ok(result.isWellFormed());
  assert.ok(result.endsWith('\n[Code truncated]'));
});
