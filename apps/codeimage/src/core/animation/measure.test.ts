import assert from 'node:assert/strict';
import {test} from 'vitest';
import {measureCode, type MeasuredNode} from './measure';

// A monospace font 9.5 px wide whose fallbacks draw CJK 1.5 cells wide and
// emoji 2 cells wide, on 22 px lines.
const advance: Record<string, number> = {你: 14.25, '👋': 19};

function fakeLayout() {
  const calls: string[] = [];
  const measure = async (code: string): Promise<MeasuredNode> => {
    calls.push(code);
    const lines = code.split('\n');
    return {
      width: 0,
      height: 8 + lines.length * 22,
      children: [],
      runs: lines.map(text => ({
        text,
        width: [...new Intl.Segmenter().segment(text)].reduce(
          (width, {segment}) => width + (advance[segment] ?? 9.5),
          0,
        ),
      })),
    };
  };
  return {calls, measure};
}

test('measures the code font once from a probe line', async () => {
  const {calls, measure} = fakeLayout();
  const {metrics, widths} = await measureCode(measure, ['const a = 1;']);
  assert.deepEqual(metrics, {charWidth: 9.5, lineHeight: 22});
  assert.equal(widths.size, 0);
  assert.equal(calls.length, 2);
});

test('measures each wide grapheme once, in cells', async () => {
  const {calls, measure} = fakeLayout();
  const {widths} = await measureCode(measure, [
    '// 你好 👋',
    'const 你 = "👋";',
  ]);
  assert.deepEqual(
    [...widths],
    [
      ['你', 1.5],
      ['好', 1],
      ['👋', 2],
    ],
  );
  assert.deepEqual(calls[2].split('\n'), ['你', '好', '👋']);
});
