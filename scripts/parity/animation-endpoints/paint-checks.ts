import {last} from '../lib';
import {PNG} from 'pngjs';
import pixelmatch from 'pixelmatch';
import {PIXELMATCH_THRESHOLD} from '../lib';
import {writeFile} from 'node:fs/promises';
import {type Measured} from './types';
import {lineCount} from './layout-checks';
export type Rect = {x: number; y: number; width: number; height: number};
export type Point = {x: number; y: number};
export function fromSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = dx * dx + dy * dy;
  const along = length
    ? Math.min(
        1,
        Math.max(
          0,
          ((point.x - start.x) * dx + (point.y - start.y) * dy) / length,
        ),
      )
    : 0;
  return Math.hypot(
    point.x - (start.x + along * dx),
    point.y - (start.y + along * dy),
  );
}
export function codeRows(hold: Measured, path: number[]): Rect[] {
  const nodes = path.reduce(
    (nodes, index) => [...nodes, last(nodes).children[index]],
    [hold],
  );
  const [scroller, codeBox] = nodes.slice(-2);
  return codeBox.children.map(line => ({
    x: scroller.transform[4],
    y: line.transform[5],
    width: scroller.width * scroller.transform[0],
    height: line.height * line.transform[3],
  }));
}
export function paintShifts(a: PNG, b: PNG, rows: Rect[]) {
  return rows.map(row => {
    const left = Math.max(0, Math.round(row.x));
    const top = Math.max(0, Math.round(row.y));
    const right = Math.min(a.width, Math.round(row.x + row.width));
    const bottom = Math.min(a.height, Math.round(row.y + row.height));
    const sums = [0, 0, 0];
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        const at = (y * a.width + x) * 4;
        for (const channel of [0, 1, 2]) {
          sums[channel] += a.data[at + channel] - b.data[at + channel];
        }
      }
    }
    const pixels = (right - left) * (bottom - top);

    return pixels > 0
      ? Math.max(...sums.map(sum => Math.abs(sum) / pixels))
      : Infinity;
  });
}
export const PAINT_TOLERANCE = 0.05;
export const DIMMED_MARK_TOLERANCE = 0.5;
export const CENTER_TOLERANCE = 0.75;
export const WINDOW_DRIFT_TOLERANCE = 3 / 64;
export const WINDOW_OUT_TOLERANCE = 1 / 64;
export type Marks = {lines: {line: number}[]; focusedLines: number[]};
export function dimmedMarks(code: string, marks: Marks | undefined) {
  const inCode = (line: number) => line >= 1 && line <= lineCount(code);
  const focused = marks?.focusedLines.filter(inCode) ?? [];
  return new Set(
    marks && focused.length
      ? marks.lines
          .map(mark => mark.line)
          .filter(line => inCode(line) && !focused.includes(line))
          .map(line => line - 1)
      : [],
  );
}
export function crop(image: PNG, {x, y, width, height}: Rect) {
  const cropped = new PNG({width, height});
  PNG.bitblt(image, cropped, x, y, width, height, 0, 0);
  return cropped;
}
export async function diffPercent(a: PNG, b: PNG, diffPath?: string) {
  if (a.width !== b.width || a.height !== b.height) return Infinity;
  const diff = new PNG({width: a.width, height: a.height});
  const pixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: PIXELMATCH_THRESHOLD,
  });
  if (pixels && diffPath) await writeFile(diffPath, PNG.sync.write(diff));
  return (pixels / (a.width * a.height)) * 100;
}
export function sideBySide(images: PNG[], gap: number) {
  const width =
    images.reduce((sum, image) => sum + image.width, 0) +
    gap * (images.length - 1);
  const height = Math.max(...images.map(image => image.height));
  const sheet = new PNG({width, height});
  sheet.data.fill(255);
  let x = 0;
  for (const image of images) {
    PNG.bitblt(image, sheet, 0, 0, image.width, image.height, x, 0);
    x += image.width + gap;
  }
  return sheet;
}
