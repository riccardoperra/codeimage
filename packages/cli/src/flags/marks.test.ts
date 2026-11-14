import {describe, expect, it} from 'vitest';
import {snapshotMarkup, renderSnapshot} from '@codeimage/render';
import {prepare} from './test-utils';
import {parseArgs} from '../args';

const diff =
  'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-const old = 1;\n+const next = 2;\ndiff --git a/b.py b/b.py\n--- a/b.py\n+++ b/b.py\n@@ -1 +1 @@\n-print(1)\n+print(2)\n';

describe('marks flag', () => {
  it('imports one tab per text file, with inferred languages and diff marks', async () => {
    const {snapshot} = await prepare(
      ['--diff'],
      [{name: 'change.diff', code: diff}],
    );
    expect(snapshot.editor.editors).toMatchObject([
      {
        tabName: 'a.ts',
        languageId: 'typescript',
        marks: {
          lines: [
            {line: 1, kind: 'removed'},
            {line: 2, kind: 'added'},
          ],
        },
      },
      {
        tabName: 'b.py',
        languageId: 'python',
        marks: {
          lines: [
            {line: 1, kind: 'removed'},
            {line: 2, kind: 'added'},
          ],
        },
      },
    ]);
    const markup = await snapshotMarkup(snapshot);
    expect(markup.html).toContain('data-mark="added"');
    expect(markup.html).toContain('data-mark="removed"');
    expect(await renderSnapshot(snapshot)).toBeInstanceOf(Uint8Array);
  });
  it('rejects malformed diffs and invalid highlight ranges', async () => {
    await expect(prepare(['--diff'])).rejects.toThrow('--diff');
    for (const value of ['', '0', '5-3', '2-', '1,,2', '9007199254740992']) {
      expect(() => parseArgs([`--highlight=${value}`])).toThrow('--highlight');
    }
  });
  it('applies highlight ranges and focus against the displayed source numbers', async () => {
    const {snapshot} = await prepare([
      '--highlight',
      '3-5,9',
      '--focus',
      '--lines',
      '4-9',
    ]);
    expect(snapshot.editor.editors[0].marks).toEqual({
      lines: [
        {line: 1, kind: 'highlight'},
        {line: 2, kind: 'highlight'},
        {line: 6, kind: 'highlight'},
      ],
      focus: true,
    });
    expect((await snapshotMarkup(snapshot)).html).toContain(
      'data-line-focus="true"',
    );
  });
  it.each([
    [
      'a.ts',
      'const a = 1; // [!code ++]\n// [!code focus:2]\nconst b = 2;\nconst c = 3;',
      'typescript',
    ],
    ['a.py', 'a = 1 # [!code ++]\n# [!code focus:2]\nb = 2\nc = 3', 'python'],
    [
      'a.html',
      '<p>a</p><!-- [!code ++] -->\n<!-- [!code focus:2] -->\n<p>b</p>\n<p>c</p>',
      'html',
    ],
  ])(
    'uses %s language comment tokens to convert annotations',
    async (name, code, languageId) => {
      const {snapshot} = await prepare([], [{name, code}]);
      expect(snapshot.editor.editors[0]).toMatchObject({
        languageId,
        marks: {
          lines: [
            {line: 1, kind: 'added'},
            {line: 2, kind: 'highlight'},
            {line: 3, kind: 'highlight'},
          ],
          focus: true,
        },
      });
      expect(snapshot.editor.editors[0].code).not.toContain('[!code');
    },
  );
  it('preserves diff marks after a standalone annotation disappears', async () => {
    const code =
      '--- a/a.ts\n+++ b/a.ts\n@@ -1 +1,2 @@\n-const old = 1;\n+// [!code highlight]\n+const next = 2;\n';
    const {snapshot} = await prepare(['--diff'], [{name: 'stdin', code}]);
    expect(snapshot.editor.editors[0].marks?.lines).toEqual([
      {line: 1, kind: 'removed'},
      {line: 2, kind: 'highlight'},
    ]);
  });
  it('leaves annotation syntax inside strings intact', async () => {
    const code = 'const text = "// [!code ++]";';
    const {snapshot} = await prepare([], [{name: 'a.ts', code}]);
    expect(snapshot.editor.editors[0].code).toBe(code);
    expect(snapshot.editor.editors[0].marks?.lines).toEqual([]);
  });
});
