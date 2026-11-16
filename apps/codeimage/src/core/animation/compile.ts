import type {
  Cell,
  CodeMetrics,
  MarkTransition,
  Point,
  Scene,
  SceneTiming,
  StepBox,
  TokenTransition,
  Transition,
} from './model';
import {curveOf, formatPoint} from './easing';

// The magic-move defaults: leaving tokens are gone at 30% of the transition,
// and entering tokens start at 70%.
const LEAVE_END = 0.3;
const ENTER_START = 0.7;

// Matches the focus dimming in marks.css.
const DIM_OPACITY = 0.35;

const px = (value: number) => `${Number(value.toFixed(3))}px`;
const percent = (ratio: number) => `${Number((ratio * 100).toFixed(4))}%`;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (text: string) =>
  escapeHtml(text).replace(/"/g, '&quot;');

const timingFunction = (easing: SceneTiming['easing']) =>
  easing === 'linear'
    ? 'linear'
    : `cubic-bezier(${curveOf(easing).map(formatPoint).join(', ')})`;

export const animationCss = (
  id: string,
  {transitionMs, easing, offsetMs = 0}: SceneTiming,
) =>
  `animation:${id} ${transitionMs}ms ${timingFunction(easing)} ${-offsetMs}ms both`;

type Pose = Point & {opacity: number};

type Motion = Transition<unknown>;

type Layer<T> = {
  place: (cell: Cell, box: StepBox) => Point;
  element: (item: T, style: string) => string;
  // How a kept item looked in the step it leaves, when its looks change.
  before?: (item: T) => T | undefined;
};

// `name` prefixes every keyframes rule, so scenes that share a stylesheet
// need distinct names.
export function compileScene(
  scene: Scene,
  metrics: CodeMetrics,
  timing: SceneTiming,
  name: string,
  typewriter = false,
): {html: string; css: string; activeRanges: [number, number][]} {
  const {charWidth, lineHeight} = metrics;
  const {from, to} = scene;
  const keyframes: string[] = [];
  let count = 0;
  let moving = false;
  let leaving = false;
  let entering = false;
  const animate = (frames: string, id = `${name}-${count++}`) => {
    keyframes.push(`@keyframes ${id}{${frames}}`);
    return animationCss(id, timing);
  };
  const at = ({x, y}: Point) => `left:${px(x)};top:${px(y)}`;

  const compileLayer = <T extends Motion>(
    transitions: readonly T[],
    layer: Layer<T>,
    typed = false,
  ) => {
    const typing = typed
      ? transitions
          .flatMap(item => {
            const motion: Motion = item;
            return motion.kind === 'enter' ? [{item, to: motion.to}] : [];
          })
          .sort((a, b) => a.to.line - b.to.line || a.to.col - b.to.col)
          .map(({item}, order) => [item, order] as const)
      : [];
    const typedOrder = new Map<T, number>(typing);
    const slot = (1 - ENTER_START) / Math.max(1, typing.length);
    const pose = (cell: Cell, box: StepBox): Pose => ({
      ...layer.place(cell, box),
      opacity: box.dimmed.has(cell.line) ? DIM_OPACITY : 1,
    });
    // Takumi rounds layout positions to device pixels but not transforms, so
    // a move animates `left` and `top`. Both endpoints then land on the pixels
    // the static layout uses.
    const glide = (item: T, start: Pose, end: Pose) => {
      const fades = start.opacity !== end.opacity;
      const frame = (pose: Pose) =>
        `{${at(pose)}${fades ? `;opacity:${pose.opacity}` : ''}}`;
      const style = [at(end)];
      if (fades || start.x !== end.x || start.y !== end.y) {
        moving = true;
        style.push(animate(`from${frame(start)}to${frame(end)}`));
      }
      if (!fades && end.opacity !== 1) style.push(`opacity:${end.opacity}`);
      return layer.element(item, style.join(';'));
    };
    return transitions
      .map(item => {
        const motion: Motion = item;
        if (motion.kind === 'leave') {
          leaving = true;
          const start = pose(motion.from, from);
          const fade = `0%{opacity:${start.opacity}}${percent(LEAVE_END)}{opacity:0}100%{opacity:0}`;
          return layer.element(item, `${at(start)};${animate(fade)}`);
        }
        const end = pose(motion.to, to);
        if (motion.kind === 'enter') {
          entering = true;
          const order = typedOrder.get(item);
          const start =
            order === undefined ? ENTER_START : ENTER_START + order * slot;
          const shown =
            order === undefined
              ? ''
              : `${percent(start + slot)}{opacity:${end.opacity}}`;
          const fade = `0%{opacity:0}${percent(start)}{opacity:0}${shown}100%{opacity:${end.opacity}}`;
          return layer.element(item, `${at(end)};${animate(fade)}`);
        }
        const start = pose(motion.from, from);
        const before = layer.before?.(item);
        if (!before) return glide(item, start, end);
        return (
          glide(before, start, {...end, opacity: 0}) +
          glide(item, {...start, opacity: 0}, end)
        );
      })
      .join('');
  };

  const sizedBox = (id: string, fromColumns: number, toColumns: number) => {
    const size = (columns: number, rows: number) =>
      `width:${px(columns * charWidth)};height:${px(rows * lineHeight)}`;
    if (fromColumns !== toColumns || from.rows !== to.rows) moving = true;
    const end = size(toColumns, to.rows);
    return `position:relative;${end};${animate(`from{${size(fromColumns, from.rows)}}to{${end}}`, id)}`;
  };

  const token = (token: TokenTransition, style: string) =>
    `<span class="${escapeAttribute(token.classes)}" style="position:absolute;white-space:pre;${style}">${escapeHtml(token.text)}</span>`;

  const code = compileLayer(
    scene.code,
    {
      place: cell => ({x: cell.col * charWidth, y: cell.line * lineHeight}),
      element: token,
      before: token =>
        token.kind === 'move' && token.fromClasses !== undefined
          ? {...token, classes: token.fromClasses}
          : undefined,
    },
    typewriter,
  );
  const bands = (attributes: (mark: MarkTransition['mark']) => string) =>
    compileLayer(scene.marks, {
      place: cell => ({x: 0, y: cell.line * lineHeight}),
      element: ({mark}: MarkTransition, style) =>
        `<div ${attributes(mark)} style="position:absolute;right:0;height:${px(lineHeight)};${style}"></div>`,
    });
  const {gutter} = scene;
  const numbers =
    gutter &&
    compileLayer(gutter.numbers, {
      place: cell => ({x: cell.col * charWidth, y: cell.line * lineHeight}),
      element: token,
    });

  // Each layer sits in the box of the static layout that holds it, so the
  // theme's paddings place it. A band spans the padding box of its line or
  // line number. marks.css draws its part in the window inset and its sign
  // from the attributes of the AnimatedCodeView root.
  const html = [
    gutter === null
      ? ''
      : `<div class="cm-gutters" aria-hidden="true"><div class="cm-gutter cm-lineNumbers"><div class="cm-gutterElement" style="grid-row:1">${bands(mark => `class="cm-gutterElement cm-lineMark-${mark}"`)}<div style="${sizedBox(`${name}-gutter`, gutter.fromColumns, gutter.toColumns)}">${numbers}</div></div></div></div>`,
    `<div class="cm-content cm-lineWrapping"><div class="cm-line" style="position:relative"><div style="position:absolute;left:0;top:0;right:0;bottom:0">${bands(mark => `data-mark="${mark}"`)}</div><div style="${sizedBox(`${name}-box`, from.columns, to.columns)}">${code}</div></div></div>`,
  ].join('');
  const activeRanges: [number, number][] = moving
    ? [[0, timing.transitionMs]]
    : [];
  if (!moving) {
    if (leaving) activeRanges.push([0, timing.transitionMs * LEAVE_END]);
    if (entering)
      activeRanges.push([
        timing.transitionMs * ENTER_START,
        timing.transitionMs,
      ]);
  }
  return {html, css: keyframes.join('\n'), activeRanges};
}
