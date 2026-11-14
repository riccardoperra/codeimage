import type {TabMarks} from '@codeimage/store/editor/model';
import type {TokenLine} from '@core/snapshot/tokenize';

// Persisted with the project. A step points at a tab, so the tabs stay the
// only place that holds code.
export type AnimationSettings = {
  steps: {editorId: string; holdMs: number}[];
  transitionMs: number;
  easing: 'smooth' | 'snappy' | 'linear';
  fps: 24 | 30 | 50 | 60;
};

export const EASING_CURVES: Record<AnimationSettings['easing'], string> = {
  smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
  snappy: 'cubic-bezier(0.2, 0, 0, 1)',
  linear: 'linear',
};

// One tab as an animation step sees it.
export type Step = {
  lines: TokenLine[];
  marks: TabMarks;
  lineNumberStart: number;
};

// Rows and code-font cells from the top left of the step's code, 0-based. A
// column is fractional after a glyph wider than one cell.
export type Cell = {line: number; col: number};

// A token a step keeps is a `move`, even when its cell does not change.
export type TokenTransition =
  | {
      kind: 'move';
      key: string;
      text: string;
      classes: string;
      // The classes the token had, when the step changes its highlighting.
      fromClasses?: string;
      from: Cell;
      to: Cell;
    }
  | {kind: 'enter'; key: string; text: string; classes: string; to: Cell}
  | {kind: 'leave'; key: string; text: string; classes: string; from: Cell};

// The size and state of one step's code box, in cells.
export type StepBox = {
  rows: number;
  // The widest line, diff indent included.
  columns: number;
  // Columns before the code that the diff signs take, 0 or 2.
  indent: number;
  // Digits of the widest line number, 0 without line numbers.
  gutterColumns: number;
  // Rows that focus mode dims.
  dimmed: ReadonlySet<number>;
};

// Everything that changes between two steps. Each layer is placed inside its
// own box of the static layout, so a cell maps to pixels without offsets.
export type Scene = {
  code: TokenTransition[];
  // Null when line numbers are off.
  gutter: TokenTransition[] | null;
  // A mark's `classes` is its kind, and its `text` is the text of its line.
  marks: TokenTransition[];
  from: StepBox;
  to: StepBox;
};

// Cells per grapheme, for graphemes the code font does not draw one cell
// wide, such as CJK and emoji from the fallback fonts.
export type GlyphWidths = ReadonlyMap<string, number>;

// Measured once per font and size, in CSS pixels.
export type CodeMetrics = {charWidth: number; lineHeight: number};

export type Point = {x: number; y: number};

export type Size = {width: number; height: number};

export type NonEmpty<T> = readonly [T, ...T[]];

export type SceneTiming = {
  transitionMs: number;
  easing: AnimationSettings['easing'];
  // Starts every animation this far into the transition. A scene that shows
  // the second half of a transition uses it.
  offsetMs?: number;
};
