import {curveOf} from './easing';
import {animationCss, compileScene} from './compile';
import {
  type Easing,
  type CodeMetrics,
  type GlyphWidths,
  type NonEmpty,
  type Point,
  type Size,
  type Step,
} from './model';
import {pairScene} from './pair';

// Where an export target puts the window inside its frame.
export type WindowPlacement = {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
};

// The static export of one step, as the renderer measured it, in CSS pixels.
// An export target gives every step the same frame and moves the window.
export type StepLayout = {size: Size; window: WindowPlacement | null};

export type TimelineStep = Step & {
  layout: StepLayout;
  holdMs: number;
  transition?: {ms: number; easing: Easing};
};

export type TimelineOptions = {
  transitionMs: number;
  easing: Easing;
  // Frames per second of the export. Any rate, not only a persisted one.
  fps: number;
  lineNumbers: boolean;
  metrics: CodeMetrics;
  widths: GlyphWidths;
  typewriter?: boolean;
};

// `offset` moves the frame from the top left of the video to its center.
export type FramePlacement = StepLayout & {offset: Point};

export type FrameBox = Pick<FramePlacement, 'size' | 'offset'>;

// `animation` is the declaration that plays the motion's keyframes.
export type FrameMotion =
  // A natural frame resizes and slides on one easing, so its center stays.
  | {kind: 'slide'; from: FrameBox; to: FrameBox; animation: string}
  // A target frame keeps its size, and its window moves and scales.
  | {
      kind: 'window';
      size: Size;
      from: WindowPlacement;
      to: WindowPlacement;
      animation: string;
    };

// `step` is the tab the frame shows as active. A transition is two scenes
// that switch it halfway, so each end matches the static export of its step.
export type TimelineScene =
  | {kind: 'hold'; step: number; durationMs: number; frame: FramePlacement}
  | {
      kind: 'transition';
      step: number;
      durationMs: number;
      // How far into the transition the scene starts.
      offsetMs: number;
      activeRanges: readonly (readonly [number, number])[];
      // The code area, from compileScene.
      code: string;
      frame: FrameMotion;
    };

export type Timeline = {
  // The largest frame over all steps, in whole CSS pixels.
  width: number;
  height: number;
  scenes: TimelineScene[];
  // The keyframes every transition scene plays.
  css: string;
};

// The elements a renderer draws the frame and its window with.
export type FrameSelectors = {frame: string; window: string};

export const windowDeclarations = (window: WindowPlacement) =>
  `left:${window.left}px;top:${window.top}px;width:${window.width}px;height:${window.height}px;transform:scale(${window.scale})`;

// How far `easing` has moved at `time`, both from 0 to 1.
export function easedProgress(easing: Easing, time: number) {
  const [x1, y1, x2, y2] = curveOf(easing);
  const bezier = (p1: number, p2: number, t: number) =>
    3 * p1 * t * (1 - t) ** 2 + 3 * p2 * t ** 2 * (1 - t) + t ** 3;
  // x grows with t, so halving the range finds the t whose x is `time`.
  let low = 0;
  let high = 1;
  for (let i = 0; i < 40; i++) {
    const t = (low + high) / 2;
    if (bezier(x1, x2, t) < time) low = t;
    else high = t;
  }
  return bezier(y1, y2, (low + high) / 2);
}

// The window `progress` of the way from one placement to the next. Its size
// moves with the code inside it. Its visible box, size times scale, never
// grows past the straight line between the two end boxes, and its center
// moves on the line between theirs, so it stays inside any area that holds
// both ends, like the padding of a target frame.
function windowAt(
  from: WindowPlacement,
  to: WindowPlacement,
  progress: number,
): WindowPlacement {
  const along = (start: number, end: number) =>
    start + (end - start) * progress;
  const width = along(from.width, to.width);
  const height = along(from.height, to.height);
  const scale = Math.min(
    along(from.width * from.scale, to.width * to.scale) / width,
    along(from.height * from.scale, to.height * to.scale) / height,
  );
  const center = (window: WindowPlacement) => ({
    x: window.left + (window.width * window.scale) / 2,
    y: window.top + (window.height * window.scale) / 2,
  });
  const [start, end] = [center(from), center(to)];
  return {
    left: along(start.x, end.x) - (width * scale) / 2,
    top: along(start.y, end.y) - (height * scale) / 2,
    width,
    height,
    scale,
  };
}

// CSS moves each property of a keyframe on its own line, and the visible box
// of a window that changes scale is a product of two of them. Such a window
// plays its path in stops instead, linearly, each at the progress the easing
// gives its time. Both ends stay the placements of the holds.
const WINDOW_STOPS = 200;

// When a transition plays, on the timeline of an export at `fps`.
type Playback = {startMs: number; transitionMs: number; fps: number};

// The times of a transition that get a stop, from 0 to 1. A window is off its
// path between two stops, so every frame an export draws gets its own. Takumi
// draws frame k at floor(k * 1000 / fps) ms. The even stops keep a preview
// close to the path at the times in between.
function windowStopTimes({startMs, transitionMs, fps}: Playback): number[] {
  const times = new Set(
    Array.from({length: WINDOW_STOPS + 1}, (_, index) => index / WINDOW_STOPS),
  );
  for (let frame = Math.ceil((startMs * fps) / 1000); ; frame++) {
    const timeMs = Math.floor((frame * 1000) / fps) - startMs;
    if (timeMs >= transitionMs) break;
    times.add(timeMs / transitionMs);
  }
  return [...times].sort((a, b) => a - b);
}

function windowKeyframes(
  from: WindowPlacement,
  to: WindowPlacement,
  easing: Easing,
  playback: Playback,
): {stops: string; easing: Easing} {
  if (from.scale === to.scale) {
    return {
      stops: `from{${windowDeclarations(from)}}to{${windowDeclarations(to)}}`,
      easing,
    };
  }
  const stops = windowStopTimes(playback).map(time => {
    const window =
      time === 0
        ? from
        : time === 1
          ? to
          : windowAt(from, to, easedProgress(easing, time));
    return `${100 * time}%{${windowDeclarations(window)}}`;
  });
  return {stops: stops.join(''), easing: 'linear'};
}

const sizeDeclarations = ({width, height}: Size) =>
  `width:${width}px;height:${height}px`;

const boxDeclarations = ({size, offset}: FrameBox) =>
  `transform:translate(${offset.x}px,${offset.y}px);${sizeDeclarations(size)}`;

// The frame is exactly as large as the timeline says, whatever its content.
const sizedFrame = ({frame}: FrameSelectors, declarations: string) =>
  `${frame}{min-width:0;max-width:none;${declarations}}`;

// Pins the window inside a target frame, at the place `declarations` give.
export const targetWindowCss = (
  {frame, window}: FrameSelectors,
  declarations: string,
) =>
  `${frame}{padding:0!important;min-width:0!important;max-width:none!important}${window}{position:absolute;transform-origin:top left;${declarations}}`;

// Places and sizes the frame of one scene, and its window in a target frame.
export function frameRules(
  scene: TimelineScene,
  selectors: FrameSelectors,
): string {
  if (scene.kind === 'hold') {
    const {window} = scene.frame;
    return `${sizedFrame(selectors, boxDeclarations(scene.frame))}${window ? targetWindowCss(selectors, windowDeclarations(window)) : ''}`;
  }
  const {frame} = scene;
  return frame.kind === 'window'
    ? `${sizedFrame(selectors, sizeDeclarations(frame.size))}${targetWindowCss(selectors, frame.animation)}`
    : sizedFrame(selectors, frame.animation);
}

export const transitionHalfMs = (ms: number) => Math.ceil(ms / 2);

export function planTimeline(
  steps: NonEmpty<TimelineStep>,
  options: TimelineOptions,
): Timeline {
  const {fps, lineNumbers, metrics, widths, typewriter = false} = options;
  const sizes = steps.map(({layout}) => ({
    width: Math.round(layout.size.width),
    height: Math.round(layout.size.height),
  }));
  const width = Math.max(...sizes.map(size => size.width));
  const height = Math.max(...sizes.map(size => size.height));
  // Whole pixels keep both ends on the pixels of the static export.
  const frames = steps.map(({layout}, index): FramePlacement => ({
    ...layout,
    offset: {
      x: Math.floor((width - sizes[index].width) / 2),
      y: Math.floor((height - sizes[index].height) / 2),
    },
  }));

  const scenes: TimelineScene[] = [];
  const css: string[] = [];
  let startMs = 0;
  for (const [index, step] of steps.entries()) {
    scenes.push({
      kind: 'hold',
      step: index,
      durationMs: step.holdMs,
      frame: frames[index],
    });
    startMs += step.holdMs;
    const next = steps[index + 1];
    if (!next) continue;
    const transitionMs = next.transition?.ms ?? options.transitionMs;
    const easing = next.transition?.easing ?? options.easing;
    const halfMs = transitionHalfMs(transitionMs);

    const name = `t${index}`;
    const from = frames[index];
    const to = frames[index + 1];
    const motion =
      from.window && to.window
        ? ({
            kind: 'window',
            size: to.size,
            from: from.window,
            to: to.window,
          } as const)
        : ({kind: 'slide', from, to} as const);
    const window =
      motion.kind === 'window'
        ? windowKeyframes(motion.from, motion.to, easing, {
            startMs,
            transitionMs,
            fps,
          })
        : null;
    startMs += transitionMs;
    css.push(
      window
        ? `@keyframes ${name}-window{${window.stops}}`
        : `@keyframes ${name}-slide{from{${boxDeclarations(from)}}to{${boxDeclarations(to)}}}`,
    );
    const scene = pairScene(step, next, lineNumbers, widths, typewriter);
    for (const [active, offsetMs, durationMs] of [
      [index, 0, halfMs],
      [index + 1, halfMs, transitionMs - halfMs],
    ] as const) {
      const timing = {transitionMs, easing, offsetMs};
      const compiled = compileScene(scene, metrics, timing, name, typewriter);
      // The second half plays the keyframes of the first, from its offset.
      if (offsetMs === 0) css.push(compiled.css);
      scenes.push({
        kind: 'transition',
        step: active,
        durationMs,
        offsetMs,
        activeRanges: (boxDeclarations(from) !== boxDeclarations(to) ||
        (from.window &&
          to.window &&
          windowDeclarations(from.window) !== windowDeclarations(to.window))
          ? ([[0, transitionMs]] satisfies [number, number][])
          : compiled.activeRanges
        ).map(([start, end]): [number, number] => [
          start - offsetMs,
          end - offsetMs,
        ]),
        code: compiled.html,
        frame: {
          ...motion,
          animation: animationCss(`${name}-${motion.kind}`, {
            ...timing,
            easing: window?.easing ?? easing,
          }),
        },
      });
    }
  }

  return {
    width,
    height,
    scenes: scenes.filter(scene => scene.durationMs > 0),
    css: css.join('\n'),
  };
}
