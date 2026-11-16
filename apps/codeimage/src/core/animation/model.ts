import type {LineMark, TabMarks} from '@codeimage/store/editor/model';
import type {TokenLine} from '@core/snapshot/tokenize';

export type StepView =
  | {kind: 'tab'}
  | {kind: 'diff'; side: 'before' | 'after'}
  | {kind: 'script'; step: number};

export type AnimationStepSettings = {
  id: string;
  editorId: string;
  view?: StepView;
  holdMs: number;
  transition?: {ms: number; easing: EasingValue};
};
export type AnimationHeader = {mode: 'tab' | 'title' | 'tabs'; title: string};
export type AnimationSettings = {
  steps: NonEmpty<AnimationStepSettings>;
  transitionMs: number;
  easing: EasingValue;
  fps: 24 | 30 | 50 | 60;
  header: AnimationHeader;
};

export type EasingName = 'smooth' | 'snappy' | 'strong' | 'linear';
export type EasingValue = EasingName | `cubic-bezier(${string})`;
export type EasingCurve = readonly [number, number, number, number];
export type Easing = EasingName | EasingCurve;

export const EASING_CURVES = {
  smooth: [0.65, 0, 0.35, 1],
  snappy: [0.2, 0, 0, 1],
  strong: [0.77, 0, 0.175, 1],
  linear: [0, 0, 1, 1],
} as const satisfies Record<EasingName, EasingCurve>;

// One tab as an animation step sees it.
export type Step = {
  rows?: number[];
  source?: string;
  lines: TokenLine[];
  marks: TabMarks;
  lineNumberStart: number;
};

// Rows and code-font cells from the top left of the step's code, 0-based. A
// column is fractional after a glyph wider than one cell.
export type Cell = {line: number; col: number};

// An element a step keeps is a `move`, even when its cell does not change.
// `Moved` holds what only a kept element carries.
export type Transition<T, Moved = unknown> =
  | (T & Moved & {kind: 'move'; from: Cell; to: Cell})
  | (T & {kind: 'enter'; to: Cell})
  | (T & {kind: 'leave'; from: Cell});

// A run of code without whitespace, or a line number.
export type Token = {key: string; text: string; classes: string};

// `fromClasses` names the classes a kept token had, when the step changes its
// highlighting.
export type TokenTransition = Transition<Token, {fromClasses?: string}>;

export type MarkKind = LineMark['kind'];

export type Mark = {key: string; mark: MarkKind};

export type MarkTransition = Transition<Mark>;

// The size and state of one step's code box, in cells.
export type StepBox = {
  rows: number;
  // The widest line.
  columns: number;
  // Rows that focus mode dims.
  dimmed: ReadonlySet<number>;
};

// Everything that changes between two steps. Each layer is placed inside its
// own box of the static layout, so a cell maps to pixels without offsets.
export type Scene = {
  leaveEnd?: number;
  enterStart?: number;
  code: TokenTransition[];
  // Null when line numbers are off.
  gutter: Gutter | null;
  marks: MarkTransition[];
  from: StepBox;
  to: StepBox;
};

// Line numbers, and the digits of the widest one in each step.
export type Gutter = {
  numbers: TokenTransition[];
  fromColumns: number;
  toColumns: number;
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
  easing: Easing;
  // Starts every animation this far into the transition. A scene that shows
  // the second half of a transition uses it.
  offsetMs?: number;
};
