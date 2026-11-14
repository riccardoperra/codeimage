import {describe, expect, it} from 'vitest';
import {parseAnnotations} from './parseAnnotations';

describe('parseAnnotations', () => {
  it.each([
    ['++', 'added'],
    ['--', 'removed'],
    ['highlight', 'highlight'],
    ['focus', 'highlight'],
  ])('converts %s', (notation, kind) => {
    expect(
      parseAnnotations(`const n = 1; // [!code ${notation}]`, {line: '//'}),
    ).toEqual({
      code: 'const n = 1;',
      count: 1,
      marks: {lines: [{line: 1, kind}], focus: notation === 'focus'},
    });
  });
  it.each(['highlight', 'focus'])('bounds %s:N to the document', notation => {
    const result = parseAnnotations(
      `one // [!code ${notation}:3]\ntwo\nthree\nfour`,
      {line: '//'},
    );
    expect(result.marks.lines.map(mark => mark.line)).toEqual([1, 2, 3]);
    expect(result.marks.focus).toBe(notation === 'focus');
  });
  it('accepts Python comments and standalone annotations for following code', () => {
    expect(parseAnnotations('# [!code ++]\nprint("hi")', {line: '#'})).toEqual({
      code: 'print("hi")',
      count: 1,
      marks: {lines: [{line: 1, kind: 'added'}], focus: false},
    });
  });
  it('accepts HTML comments without removing surrounding markup', () => {
    expect(
      parseAnnotations('<p>hi</p> <!-- [!code highlight] -->', {
        block: {open: '<!--', close: '-->'},
      }).code,
    ).toBe('<p>hi</p>');
  });
  it('retains ordinary comment text', () => {
    expect(
      parseAnnotations('let a = 1; // explanation [!code ++]', {line: '//'})
        .code,
    ).toBe('let a = 1; // explanation ');
  });
  it('does not convert unsupported annotations or comment syntaxes', () => {
    for (const code of [
      'let n; // [!code wat]',
      'let n; // [!code ++:2]',
      'let n; // [!code highlight:0]',
    ]) {
      expect(parseAnnotations(code, {line: '//'}).count).toBe(0);
    }
    expect(parseAnnotations('let n; # [!code ++]', {line: '//'}).count).toBe(0);
  });
  it('leaves annotation-looking text in string literals alone', () => {
    const code = 'const literal = "// [!code ++]";';
    expect(parseAnnotations(code, {line: '//'})).toEqual({
      code,
      count: 0,
      marks: {lines: [], focus: false},
    });
  });
  it('keeps notation inside a multiline template string', () => {
    const code = 'const literal = `one\n// [!code ++]\n`;';
    expect(parseAnnotations(code, {line: '//'}).count).toBe(0);
  });
  it('preserves line endings without annotations and caps oversized ranges', () => {
    expect(parseAnnotations('one\ntwo\n', {line: '//'}).code).toBe(
      'one\ntwo\n',
    );
    expect(
      parseAnnotations('one // [!code focus:99999999999999]', {line: '//'})
        .marks.lines,
    ).toHaveLength(1);
  });
});
