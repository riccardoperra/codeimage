import type {Spoiler} from '@codeimage/store/editor/model';
import type {TokenLine} from './tokenize';

export const SPOILER_CLASS = 'cm-spoiler';
export const SPOILER_DOT_ANIMATION = 'codeimage-spoiler-dot-';

export const spoilerClockCss = (startMs: number) =>
  `.cm-spoilerDot{animation-delay:${-Math.round(startMs)}ms!important}`;

const PATHS = 12;
const TEMPOS = 3;
const DOTS_PER_COLUMN = 20;
const MAX_DOTS = 640;

function seeded(seed: string) {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index++)
    state = Math.imul(state ^ seed.charCodeAt(index), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Number(value.toFixed(2));

export function spoilerDotsHtml(columns: number, seed: string): string {
  const random = seeded(seed);
  const count = Math.min(
    MAX_DOTS,
    Math.max(6, Math.round(columns * DOTS_PER_COLUMN)),
  );
  let html = '';
  for (let index = 0; index < count; index++) {
    const size = round(0.8 + random() * random() * 1.4);
    const path = Math.floor(random() * PATHS);
    const tempo = Math.floor(random() * TEMPOS);
    html += `<i class="cm-spoilerDot cm-sd${path}-${tempo}" style="left:${round(random() * 100)}%;top:${round(14 + random() * 72)}%;width:${size}px;height:${size}px"></i>`;
  }
  return `<span class="cm-spoilerDots" aria-hidden="true">${html}</span>`;
}

export type SpoilerRun = {from: number; to: number; classes: string};

type Range = readonly [number, number];

export function spoilersByLine(
  spoilers: readonly Spoiler[] | undefined,
): Map<number, Range[]> {
  const byLine = new Map<number, Range[]>();
  for (const {line, from, to} of spoilers ?? []) {
    if (to <= from) continue;
    byLine.set(line, [...(byLine.get(line) ?? []), [from, to]]);
  }
  for (const [line, ranges] of byLine) {
    const merged: [number, number][] = [];
    for (const [from, to] of [...ranges].sort((a, b) => a[0] - b[0])) {
      const last = merged.at(-1);
      if (last && from <= last[1]) last[1] = Math.max(last[1], to);
      else merged.push([from, to]);
    }
    byLine.set(line, merged);
  }
  return byLine;
}

const blank = (text: string) => text.replace(/[^\t]/gu, ' ');

export function maskLine(
  line: TokenLine,
  ranges: readonly Range[] | undefined,
): {line: TokenLine; runs: SpoilerRun[]} {
  if (!ranges?.length) return {line, runs: []};
  const masked: TokenLine = [];
  const runs: SpoilerRun[] = [];
  let offset = 0;
  for (const span of line) {
    const end = offset + span.text.length;
    const cuts = new Set([offset, end]);
    for (const [from, to] of ranges) {
      if (from > offset && from < end) cuts.add(from);
      if (to > offset && to < end) cuts.add(to);
    }
    const points = [...cuts].sort((a, b) => a - b);
    for (let index = 0; index < points.length - 1; index++) {
      const [from, to] = [points[index], points[index + 1]];
      const text = span.text.slice(from - offset, to - offset);
      const hidden = ranges.some(range => from >= range[0] && to <= range[1]);
      if (!hidden) {
        masked.push({text, classes: span.classes});
        continue;
      }
      masked.push({
        text: blank(text),
        classes: `${span.classes} ${SPOILER_CLASS}`.trim(),
      });
      runs.push({from, to, classes: span.classes});
    }
    offset = end;
  }
  return {line: masked, runs};
}

export function maskLines(
  lines: readonly TokenLine[],
  spoilers: readonly Spoiler[] | undefined,
): {lines: TokenLine[]; runs: SpoilerRun[][]} {
  const byLine = spoilersByLine(spoilers);
  const masked = lines.map((line, index) =>
    maskLine(line, byLine.get(index + 1)),
  );
  return {
    lines: masked.map(value => value.line),
    runs: masked.map(value => value.runs),
  };
}
