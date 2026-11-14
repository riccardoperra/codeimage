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
    for (const flag of ['--highlight', '--focus']) {
      for (const value of ['', '0', '5-3', '2-', '1,,2', '9007199254740992']) {
        expect(() => parseArgs([`${flag}=${value}`])).toThrow(flag);
      }
    }
    expect(() => parseArgs(['--focus'])).toThrow('--focus');
  });
  it('applies highlight ranges and focus against the displayed source numbers', async () => {
    const {snapshot} = await prepare([
      '--highlight',
      '3-5,9',
      '--focus',
      '4,8-9',
      '--lines',
      '4-9',
    ]);
    expect(snapshot.editor.editors[0].marks).toEqual({
      lines: [
        {line: 1, kind: 'highlight'},
        {line: 2, kind: 'highlight'},
        {line: 6, kind: 'highlight'},
      ],
      focusedLines: [1, 5, 6],
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
          lines: [{line: 1, kind: 'added'}],
          focusedLines: [2, 3],
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
  it('adds repeatable ranges and annotation focus without adding highlights', async () => {
    const {snapshot} = await prepare(
      ['--focus', '2-3', '--focus', '3,5'],
      [
        {
          name: 'a.ts',
          code: 'one // [!code focus]\ntwo\nthree\nfour\nfive\nsix',
        },
      ],
    );
    expect(snapshot.editor.editors[0].marks).toEqual({
      lines: [],
      focusedLines: [1, 2, 3, 5],
    });
    const {html} = await snapshotMarkup(snapshot);
    const rows = [...html.matchAll(/<div class="cm-line"([^>]*)>/g)];
    expect(rows.map(row => row[1].includes('data-focused="true"'))).toEqual([
      true,
      true,
      true,
      false,
      true,
      false,
    ]);
  });
  it('keeps focus and highlight on the same line independent', async () => {
    const {snapshot} = await prepare(['--focus', '2', '--highlight', '2,4']);
    expect(snapshot.editor.editors[0].marks).toEqual({
      lines: [
        {line: 2, kind: 'highlight'},
        {line: 4, kind: 'highlight'},
      ],
      focusedLines: [2],
    });
    const {html} = await snapshotMarkup(snapshot);
    expect(html).toContain('data-mark="highlight" data-focused="true"');
  });
  it('keeps highlights sharp without enabling focus', async () => {
    const {snapshot} = await prepare(['--highlight', '2']);
    expect(snapshot.editor.editors[0].marks?.focusedLines).toEqual([]);
    expect((await snapshotMarkup(snapshot)).html).toContain(
      'data-line-focus="false"',
    );
  });
  it('focuses diff lines without replacing added or removed marks', async () => {
    const {snapshot} = await prepare(
      ['--diff', '--focus', '2'],
      [{name: 'changes.diff', code: diff}],
    );
    for (const tab of snapshot.editor.editors) {
      expect(tab.marks).toEqual({
        lines: [
          {line: 1, kind: 'removed'},
          {line: 2, kind: 'added'},
        ],
        focusedLines: [2],
      });
    }
    expect((await snapshotMarkup(snapshot)).html).toContain(
      'data-mark="added" data-focused="true"',
    );
  });
  it('remaps focus after annotation removal and line slicing', async () => {
    const {snapshot} = await prepare(
      ['--lines', '2-4', '--focus', '4'],
      [
        {
          name: 'a.ts',
          code: '// [!code focus:2]\none\ntwo\nthree\nfour',
          marks: {lines: [], focusedLines: [4]},
        },
      ],
    );
    expect(snapshot.editor.editors[0].marks).toEqual({
      lines: [],
      focusedLines: [1, 2, 3],
    });
  });
  it.each([
    ['--focus', '99'],
    ['--lines', '3-4'],
  ])(
    'disables dimming when no focused line remains with %s %s',
    async (...args) => {
      const {snapshot} = await prepare(args, [
        {name: 'a.ts', code: 'one\ntwo\nthree\nfour'},
      ]);
      expect(snapshot.editor.editors[0].marks?.focusedLines).toEqual([]);
      expect((await snapshotMarkup(snapshot)).html).toContain(
        'data-line-focus="false"',
      );
    },
  );
  it('disables dimming when slicing away the last focused annotation', async () => {
    const {snapshot} = await prepare(
      ['--lines', '2-3'],
      [{name: 'a.ts', code: 'one // [!code focus]\ntwo\nthree'}],
    );
    expect(snapshot.editor.editors[0].marks?.focusedLines).toEqual([]);
    expect((await snapshotMarkup(snapshot)).html).toContain(
      'data-line-focus="false"',
    );
  });
});
