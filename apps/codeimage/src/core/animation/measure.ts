import type {CodeMetrics, GlyphWidths} from './model';
import {graphemes, isAscii} from './pair';

// A laid-out box in CSS pixels and the text runs it draws, as Takumi
// `measure()` returns it. A page can build the same tree from DOM ranges.
export type MeasuredNode = {
  width: number;
  height: number;
  children: MeasuredNode[];
  runs: {text: string; width: number}[];
};

// Lays out `code` in the code font, as the static view draws it.
export type MeasureCode = (code: string) => Promise<MeasuredNode>;

const PROBE_LINE = 'M'.repeat(40);

function findRun(node: MeasuredNode, text: string): {width: number} | null {
  const run = node.runs.find(run => run.text === text);
  if (run) return run;
  for (const child of node.children) {
    const found = findRun(child, text);
    if (found) return found;
  }
  return null;
}

// Measures a 40-character run once per font and size instead of each token.
// Two probe lines differ in height by exactly one line. Fallback fonts draw
// CJK and emoji wider than one cell, so each distinct grapheme outside
// printable ASCII is measured once, on its own line.
export async function measureCode(
  measure: MeasureCode,
  code: readonly string[],
): Promise<{metrics: CodeMetrics; widths: GlyphWidths}> {
  const one = await measure(PROBE_LINE);
  const two = await measure(`${PROBE_LINE}\n${PROBE_LINE}`);
  const probe = findRun(one, PROBE_LINE);
  if (!probe) throw new Error('The code font probe laid out no text run');
  const metrics = {
    charWidth: probe.width / PROBE_LINE.length,
    lineHeight: two.height - one.height,
  };
  const glyphs = [
    ...new Set(code.flatMap(graphemes).filter(glyph => !isAscii(glyph))),
  ];
  if (!glyphs.length) return {metrics, widths: new Map()};
  const layout = await measure(glyphs.join('\n'));
  return {
    metrics,
    widths: new Map(
      glyphs.flatMap(glyph => {
        const run = findRun(layout, glyph);
        return run ? [[glyph, run.width / metrics.charWidth]] : [];
      }),
    ),
  };
}
