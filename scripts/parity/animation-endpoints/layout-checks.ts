import {last} from '../lib';
import {type Measured} from './types';
export const inCssPixels = (node: Measured, scale: number): Measured => ({
  width: node.width / scale,
  height: node.height / scale,
  transform: node.transform.map((value, index) =>
    index < 4 ? value : value / scale,
  ),
  children: node.children.map(child => inCssPixels(child, scale)),
  runs: node.runs.map(run => ({
    text: run.text,
    x: run.x / scale,
    y: run.y / scale,
    width: run.width / scale,
  })),
});
export type Run = Measured['runs'][number];
export type Glyph = {char: string; x: number | null; y: number; slack: number};
export const LAYOUT_TOLERANCE = 0.5;
export const GLYPH_TOLERANCE = 0.15;
export const near = (a: number, b: number) =>
  Math.abs(a - b) <= LAYOUT_TOLERANCE;
export const sameBox = (a: Measured, b: Measured) =>
  near(a.width, b.width) &&
  near(a.height, b.height) &&
  a.transform.every((value, index) =>
    index < 4
      ? Math.abs(value - b.transform[index]) < 1e-3
      : near(value, b.transform[index]),
  );
export const box = (node: Measured) =>
  `${node.width.toFixed(1)}x${node.height.toFixed(1)} at ${node.transform[4].toFixed(1)},${node.transform[5].toFixed(1)}`;
export const runsOf = (node: Measured): [Measured, Run][] => [
  ...node.runs.map(run => [node, run] as [Measured, Run]),
  ...node.children.flatMap(runsOf),
];
export const textOf = (node: Measured) =>
  runsOf(node)
    .map(([, run]) => run.text)
    .join('')
    .replace(/\s/g, '');
export const glyphsOf = (nodes: Measured[], shift = 0, scale = 2): Glyph[] =>
  nodes.flatMap(runsOf).flatMap(([node, run]) => {
    const [a, b, c, d, e, f] = node.transform;
    const chars = [...run.text];
    const ascii = /^[ -~]*$/.test(run.text);
    const slack = node.runs.indexOf(run) * (1 / 64 / scale);
    return chars.flatMap((char, index) => {
      if (/\s/.test(char)) return [];
      const x = run.x + (index * run.width) / chars.length;
      return [
        {
          char,
          x: ascii || index === 0 ? a * x + c * run.y + e + shift : null,
          y: b * x + d * run.y + f,
          slack,
        },
      ];
    });
  });
export const markLineStarts = (html: string) =>
  html.replace(
    /<div class="cm-(?:line|gutterElement)\b[^>]*>/g,
    tag => `${tag}<span style="display:inline-block"></span>`,
  );
export const isEmpty = (node: Measured) =>
  !node.width && !node.height && !node.runs.length && !node.children.length;
export const emptyNodes = (node: Measured): Measured[] => [
  ...(isEmpty(node) ? [node] : []),
  ...node.children.flatMap(emptyNodes),
];
export function lineGlyphs(lines: Measured[], scale: number): Glyph[] {
  return lines.flatMap(line => {
    const [start] = emptyNodes(line).sort(
      (a, b) => a.transform[4] - b.transform[4],
    );
    if (!start) {
      throw new Error(`no line start before "${textOf(line)}"`);
    }
    const [first] = runsOf(line);
    if (!first) return [];
    const [node, run] = first;
    const [a, , c, , e] = node.transform;
    return glyphsOf(
      [line],
      start.transform[4] - (a * run.x + c * run.y + e),
      scale,
    );
  });
}
export const missingGlyph = (expected: Glyph[], actual: Glyph[]) =>
  expected.find(
    want =>
      !actual.some(
        got =>
          got.char === want.char &&
          near(got.y, want.y) &&
          (want.x === null ||
            (got.x !== null &&
              Math.abs(got.x - want.x) <= GLYPH_TOLERANCE + want.slack)),
      ),
  );
export const lineCount = (code: string) => code.split(/\r\n|\r|\n/).length;
export function codeBoxPath(hold: Measured, code: string): number[] | null {
  const lines = lineCount(code);
  const text = code.replace(/\s/g, '');
  const search = (node: Measured, path: number[]): number[] | null => {
    for (const [index, child] of node.children.entries()) {
      const found = search(child, [...path, index]);
      if (found) return found;
    }
    return node.children.length === lines && textOf(node) === text
      ? path
      : null;
  };
  return text ? search(hold, []) : null;
}
export function layoutJump(
  hold: Measured,
  frame: Measured,
  path: number[],
  scale: number,
) {
  const pairs: [Measured, Measured][] = [[hold, frame]];
  for (const index of path) {
    const [a, b] = last(pairs);
    if (!b.children[index]) return `no node ${path.join('.')}`;
    pairs.push([a.children[index], b.children[index]]);
  }
  const moved = pairs.findIndex(([a, b]) => !sameBox(a, b));
  if (moved >= 0) {
    const [a, b] = pairs[moved];
    return `box ${path.slice(0, moved).join('.')} ${box(a)} > ${box(b)}`;
  }
  const [[holdScroller, frameScroller], [holdCode, frameCode]] =
    pairs.slice(-2);
  const layers: [string, Measured[], Measured[]][] = [
    ['code', holdCode.children, [frameCode]],
  ];
  if (holdScroller.children.length === 2) {
    const [holdGutter] = holdScroller.children;
    const [frameGutter] = frameScroller.children;
    if (!sameBox(holdGutter, frameGutter)) {
      return `gutter ${box(holdGutter)} > ${box(frameGutter)}`;
    }

    layers.push([
      'gutter',
      holdGutter.children[0].children.slice(1),
      [frameGutter],
    ]);
  }
  for (const [layer, lines, to] of layers) {
    const missing = missingGlyph(
      lineGlyphs(lines, scale),
      glyphsOf(to, 0, scale),
    );
    if (missing) {
      return `${layer} "${missing.char}" at ${missing.x?.toFixed(1) ?? '?'},${missing.y.toFixed(1)} has no match`;
    }
  }
  return null;
}
