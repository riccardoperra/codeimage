import {animationCss, compileScene} from './compile';
import type {
  AnimationSettings,
  CodeMetrics,
  GlyphWidths,
  NonEmpty,
  Point,
  Size,
  Step,
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

export type TimelineStep = Step & {layout: StepLayout; holdMs: number};

export type TimelineOptions = Pick<
  AnimationSettings,
  'transitionMs' | 'easing'
> & {
  lineNumbers: boolean;
  metrics: CodeMetrics;
  widths: GlyphWidths;
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

export function planTimeline(
  steps: NonEmpty<TimelineStep>,
  options: TimelineOptions,
): Timeline {
  const {transitionMs, easing, lineNumbers, metrics, widths} = options;
  const sizes = steps.map(({layout}) => ({
    width: Math.round(layout.size.width),
    height: Math.round(layout.size.height),
  }));
  const width = Math.max(...sizes.map(size => size.width));
  const height = Math.max(...sizes.map(size => size.height));
  // Whole pixels keep both ends on the pixels of the static export.
  const frames = steps.map(
    ({layout}, index): FramePlacement => ({
      ...layout,
      offset: {
        x: Math.floor((width - sizes[index].width) / 2),
        y: Math.floor((height - sizes[index].height) / 2),
      },
    }),
  );

  const scenes: TimelineScene[] = [];
  const css: string[] = [];
  const halfMs = Math.floor(transitionMs / 2);
  for (const [index, step] of steps.entries()) {
    scenes.push({
      kind: 'hold',
      step: index,
      durationMs: step.holdMs,
      frame: frames[index],
    });
    const next = steps[index + 1];
    if (!next) continue;

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
    css.push(
      motion.kind === 'window'
        ? `@keyframes ${name}-window{from{${windowDeclarations(motion.from)}}to{${windowDeclarations(motion.to)}}}`
        : `@keyframes ${name}-slide{from{${boxDeclarations(from)}}to{${boxDeclarations(to)}}}`,
    );
    const scene = pairScene(step, next, lineNumbers, widths);
    for (const [active, offsetMs, durationMs] of [
      [index, 0, halfMs],
      [index + 1, halfMs, transitionMs - halfMs],
    ] as const) {
      const timing = {transitionMs, easing, offsetMs};
      const compiled = compileScene(scene, metrics, timing, name);
      // The second half plays the keyframes of the first, from its offset.
      if (offsetMs === 0) css.push(compiled.css);
      scenes.push({
        kind: 'transition',
        step: active,
        durationMs,
        offsetMs,
        code: compiled.html,
        frame: {
          ...motion,
          animation: animationCss(`${name}-${motion.kind}`, timing),
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
