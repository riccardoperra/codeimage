import {describe, expect, it} from 'vitest';
import {mapLines} from './mapLines';

describe('mapLines', () => {
  it('follows a line when a reformat expands the line above it', () => {
    const before = 'const config = {alpha: 1, beta: 2};\nconst target = 1;\n';
    const after =
      'const config = {\n  alpha: 1,\n  beta: 2,\n};\nconst target = 1;\n';
    const map = mapLines(before, after);
    expect(map.get(1)).toBe(1);
    expect(map.get(2)).toBe(5);
  });
  it('shifts lines below an insertion and drops deleted lines', () => {
    const map = mapLines('a\nb\nc\nd', 'a\nnew\nb\nd');
    expect([1, 2, 3, 4].map(line => map.get(line))).toEqual([
      1,
      3,
      undefined,
      4,
    ]);
  });
  it('maps an edited line onto its replacement', () => {
    const map = mapLines('a\nconst x=1\nb', 'a\nconst x = 1;\nb');
    expect(map.get(2)).toBe(2);
  });
});
