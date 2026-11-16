import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {fixture, cli, file, png} from './common.mjs';
export const a = await fixture(
  'a.ts',
  Array.from(
    {length: 12},
    (_, index) => `const line${index + 1} = ${index + 1};`,
  ).join('\n'),
);
export const b = await fixture('b.py', 'print("second tab")');
export const c = await fixture(
  'nested path/c.rs',
  'fn main() { println!("third tab"); }',
);
export const patch =
  'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-const before = 1;\n+const after = 2;\ndiff --git a/b.py b/b.py\n--- a/b.py\n+++ b/b.py\n@@ -1 +1 @@\n-print(1)\n+print(2)\n';
export const patchFile = await fixture('changes.diff', patch);
await cli(
  'p5-diff-stdin',
  ['--diff', '--split-tabs', '--alt', '-o', file('p5-diff.png')],
  patch,
);
await cli('p5-diff-file', [
  patchFile,
  '--diff',
  '-o',
  file('p5-diff-file.png'),
]);
assert.match(
  await readFile(file('p5-diff-01.png.alt.txt'), 'utf8'),
  /TypeScript code, a.ts/,
);
assert.match(
  await readFile(file('p5-diff-02.png.alt.txt'), 'utf8'),
  /Python code, b.py/,
);
await cli('p5-plain', [a, '-o', file('p5-plain.png')]);
await cli('p5-focus', [
  a,
  '--focus',
  '2-3',
  '--focus',
  '9',
  '-o',
  file('p5-focus.png'),
]);
export const plain = await png(file('p5-plain.png'));
export const focused = await png(file('p5-focus.png'));
assert.deepEqual([plain.width, plain.height], [focused.width, focused.height]);
assert.notDeepEqual(
  plain.data,
  focused.data,
  'marks and focus must change rendered pixels',
);
await cli('p5-focus-highlight', [
  a,
  '--focus',
  '2-3',
  '--focus',
  '9',
  '--highlight',
  '3',
  '-o',
  file('p5-focus-highlight.png'),
]);
assert.notDeepEqual(
  (await png(file('p5-focus-highlight.png'))).data,
  focused.data,
);
await cli('p5-focus-diff', [
  patchFile,
  '--diff',
  '--focus',
  '2',
  '-o',
  file('p5-focus-diff.png'),
]);
assert.notDeepEqual(
  (await png(file('p5-focus-diff.png'))).data,
  (await png(file('p5-diff-file.png'))).data,
);
await cli('p5-focus-outside', [
  a,
  '--focus',
  '99',
  '-o',
  file('p5-focus-outside.png'),
]);
assert.deepEqual((await png(file('p5-focus-outside.png'))).data, plain.data);
export const probe = await fixture(
  'probe.txt',
  Array.from({length: 6}, () => 'focusprobe').join('\n'),
);
export const preset = await fixture(
  'focus-preset.json',
  JSON.stringify({
    frame: {
      background: '#808080',
      padding: 0,
      radius: 0,
      visible: true,
      opacity: 100,
    },
    terminal: {
      showHeader: false,
      type: 'macOs',
      accentVisible: false,
      shadow: null,
      background: '#808080',
      textColor: '#ffffff',
      showWatermark: false,
      showGlassReflection: false,
      opacity: 100,
      alternativeTheme: false,
      borderType: null,
    },
    editor: {
      fontId: 'jetbrains-mono',
      fontWeight: 400,
      showLineNumbers: false,
      themeId: 'dracula',
      enableLigatures: true,
    },
  }),
);
await cli('p5-probe-plain', [
  probe,
  '--preset',
  preset,
  '-o',
  file('p5-probe-plain.png'),
]);
await cli('p5-probe-focus', [
  probe,
  '--preset',
  preset,
  '--focus',
  '2-3',
  '--focus',
  '5',
  '-o',
  file('p5-probe-focus.png'),
]);
export const probePlain = await png(file('p5-probe-plain.png'));
export const probeFocus = await png(file('p5-probe-focus.png'));
assert.deepEqual(
  [probeFocus.width, probeFocus.height],
  [probePlain.width, probePlain.height],
);
export const bands = [];
for (let y = 0; y < probePlain.height; y++) {
  const row = probePlain.data.subarray(
    y * probePlain.width * 4,
    (y + 1) * probePlain.width * 4,
  );
  if (!row.some((value, index) => index % 4 !== 3 && value !== 128)) continue;
  const last = bands.at(-1);
  if (last && last.end === y) last.end++;
  else bands.push({start: y, end: y + 1});
}
assert.equal(bands.length, 6, 'six separate text rows');
export const contrast = data =>
  data.reduce(
    (sum, value, index) => sum + (index % 4 === 3 ? 0 : Math.abs(value - 128)),
    0,
  );
export const focusPixels = bands.map(({start, end}, index) => {
  const before = probePlain.data.subarray(
    start * probePlain.width * 4,
    end * probePlain.width * 4,
  );
  const after = probeFocus.data.subarray(
    start * probePlain.width * 4,
    end * probePlain.width * 4,
  );
  const sharp = [2, 3, 5].includes(index + 1);
  if (sharp)
    assert.deepEqual(after, before, `focused line ${index + 1} stays sharp`);
  else {
    assert.ok(contrast(after) > 0);
    assert.ok(
      contrast(after) < contrast(before) * 0.5,
      `unfocused line ${index + 1} dims`,
    );
  }
  return {
    line: index + 1,
    focused: sharp,
    identical: after.equals(before),
    contrastRatio: contrast(after) / contrast(before),
  };
});
await writeFile(
  file('focus-pixels.json'),
  JSON.stringify(focusPixels, null, 2) + '\n',
);
export const annotated = await fixture(
  'annotations.ts',
  'const added = 1; // [!code ++]\nconst removed = 2; // [!code --]\n// [!code focus:2]\nconst bright = 3;\nconst next = 4;\nconst dim = 5;',
);
await cli('p5-annotations', [
  annotated,
  '--alt',
  '-o',
  file('p5-annotations.png'),
]);
assert.doesNotMatch(
  await readFile(file('p5-annotations.png.alt.txt'), 'utf8'),
  /\[!code/,
);
