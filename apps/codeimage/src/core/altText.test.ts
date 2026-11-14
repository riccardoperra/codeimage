import {describe, expect, it} from 'vitest';
import {altText} from './altText';

const tab = {
  code: 'const x = 1;',
  tab: {tabName: 'user.ts'},
  languageId: 'typescript',
  lineNumberStart: 1,
};
const NOTE = '\n[Code truncated]';
const graphemes = (text: string) =>
  Array.from(new Intl.Segmenter().segment(text), s => s.segment);

describe('altText', () => {
  it('puts language, tab name, and line range above the code', () => {
    expect(altText({...tab, code: 'a\nb\nc\nd\ne\nf'})).toBe(
      'TypeScript code, user.ts, lines 1 to 6\n\na\nb\nc\nd\ne\nf',
    );
  });

  it('counts the range from the line number start', () => {
    const code = Array(8).fill('x').join('\n');
    expect(altText({...tab, code, lineNumberStart: 5})).toMatch(
      /^TypeScript code, user\.ts, lines 5 to 12\n/,
    );
  });

  it('omits an empty tab name and names a single line', () => {
    const expected = 'TypeScript code, line 1\n\nconst x = 1;';
    expect(altText({...tab, tab: {tabName: null}})).toBe(expected);
    expect(altText({...tab, tab: {tabName: '  '}})).toBe(expected);
  });

  it('falls back to the picker label', () => {
    expect(altText({...tab, languageId: 'rust'})).toMatch(/^Rust code,/);
  });

  it('cuts long code to 1,000 characters including the note', () => {
    const result = altText({...tab, code: 'x'.repeat(2000)});
    expect(result).toHaveLength(1000);
    expect(result.endsWith(NOTE)).toBe(true);
  });

  it('never splits an emoji sequence or a CJK character', () => {
    const code = '👨‍👩‍👧漢'.repeat(1000);
    const result = altText({...tab, tab: {tabName: null}, code});
    expect(graphemes(result)).toHaveLength(1000);
    expect(result.endsWith(NOTE)).toBe(true);
    const body = result.slice(result.indexOf('\n\n') + 2, -NOTE.length);
    for (const g of graphemes(body)) expect(['👨‍👩‍👧', '漢']).toContain(g);
  });
});
