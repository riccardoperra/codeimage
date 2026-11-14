import {describe, expect, it} from 'vitest';
import {parseUnifiedDiff} from './parseUnifiedDiff';

const patch =
  'diff --git a/foo.ts b/foo.ts\n--- a/foo.ts\n+++ b/foo.ts\n@@ -1,2 +1,2 @@\n-const old = 1;\n+const next = 2;\n console.log(next);\n';
describe('parseUnifiedDiff', () => {
  it('keeps syntax-ready code and marks removed and added lines', () => {
    expect(parseUnifiedDiff(patch)).toEqual([
      {
        path: 'foo.ts',
        code: 'const old = 1;\nconst next = 2;\nconsole.log(next);\n',
        marks: {
          lines: [
            {line: 1, kind: 'removed'},
            {line: 2, kind: 'added'},
          ],
          focusedLines: [],
        },
      },
    ]);
  });
  it('makes one result for each file', () => {
    expect(
      parseUnifiedDiff(patch + patch.replaceAll('foo.ts', 'bar.ts')).map(
        file => file.path,
      ),
    ).toEqual(['foo.ts', 'bar.ts']);
  });
  it('uses the new path for a rename', () => {
    expect(
      parseUnifiedDiff(patch.replace('+++ b/foo.ts', '+++ b/renamed.ts'))[0]
        .path,
    ).toBe('renamed.ts');
  });
  it('preserves a missing final newline', () => {
    expect(
      parseUnifiedDiff(
        patch.trimEnd() + '\n\\ No newline at end of file\n',
      )[0].code.endsWith('\n'),
    ).toBe(false);
  });
  it('accepts a context line whose leading space was lost on the clipboard', () => {
    expect(
      parseUnifiedDiff(
        patch.replace(' console.log(next);', 'console.log(next);'),
      )[0].code,
    ).toBe('const old = 1;\nconst next = 2;\nconsole.log(next);\n');
  });
  it('skips binary files', () => {
    expect(
      parseUnifiedDiff(
        'diff --git a/image.png b/image.png\nBinary files a/image.png and b/image.png differ\n',
      ),
    ).toEqual([]);
  });
  it('rejects ordinary code and malformed or truncated hunks', () => {
    expect(parseUnifiedDiff('-one\n+two\n')).toEqual([]);
    expect(
      parseUnifiedDiff(patch.replace(' console.log(next);\n', '')),
    ).toEqual([]);
  });
  it('handles deleted files, CRLF, and lines that look like file headers', () => {
    const result = parseUnifiedDiff(
      '--- a/old.ts\r\n+++ /dev/null\r\n@@ -1,2 +0,0 @@\r\n--- contents\r\n-removed\r\n',
    );
    expect(result[0].path).toBe('old.ts');
    expect(result[0].code).toBe('-- contents\nremoved\n');
  });
  it('combines multiple hunks with continuous line numbers', () => {
    const result = parseUnifiedDiff(patch + '@@ -20 +20 @@\n-a\n+b\n')[0];
    expect(result.marks.lines.slice(-2)).toEqual([
      {line: 4, kind: 'removed'},
      {line: 5, kind: 'added'},
    ]);
  });
});
