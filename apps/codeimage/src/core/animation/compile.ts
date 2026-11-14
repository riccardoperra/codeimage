import type {
  Cell,
  CodeMetrics,
  Scene,
  SceneTiming,
  StepBox,
  TokenTransition,
} from './model';
import {EASING_CURVES} from './model';

// The magic-move defaults: leaving tokens are gone at 30% of the transition,
// and entering tokens start at 70%.
const LEAVE_END = 0.3;
const ENTER_START = 0.7;

// Matches the focus dimming in marks.css.
const DIM_OPACITY = 0.35;

const px = (value: number) => `${Number(value.toFixed(3))}px`;
const percent = (ratio: number) => `${ratio * 100}%`;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (text: string) =>
  escapeHtml(text).replace(/"/g, '&quot;');

export const animationCss = (
  id: string,
  {transitionMs, easing, offsetMs = 0}: SceneTiming,
) =>
  `animation:${id} ${transitionMs}ms ${EASING_CURVES[easing]} ${-offsetMs}ms both`;

type Point = {x: number; y: number};
type Pose = Point & {opacity: number};

type Layer = {
  place: (cell: Cell, box: StepBox) => Point;
  element: (text: string, classes: string, style: string) => string;
};

export function compileScene(
  scene: Scene,
  metrics: CodeMetrics,
  timing: SceneTiming,
  name = 'a',
): {html: string; css: string} {
  const {charWidth, lineHeight} = metrics;
  const {from, to} = scene;
  const keyframes: string[] = [];
  let count = 0;
  const animate = (frames: string, id = `${name}-${count++}`) => {
    keyframes.push(`@keyframes ${id}{${frames}}`);
    return animationCss(id, timing);
  };
  const at = ({x, y}: Point) => `left:${px(x)};top:${px(y)}`;

  const compileLayer = (transitions: TokenTransition[], layer: Layer) => {
    const pose = (cell: Cell, box: StepBox): Pose => ({
      ...layer.place(cell, box),
      opacity: box.dimmed.has(cell.line) ? DIM_OPACITY : 1,
    });
    // Takumi rounds layout positions to device pixels but not transforms, so
    // a move animates `left` and `top`. Both endpoints then land on the pixels
    // the static layout uses.
    const glide = (text: string, classes: string, start: Pose, end: Pose) => {
      const fades = start.opacity !== end.opacity;
      const frame = (pose: Pose) =>
        `{${at(pose)}${fades ? `;opacity:${pose.opacity}` : ''}}`;
      const style = [at(end)];
      if (fades || start.x !== end.x || start.y !== end.y) {
        style.push(animate(`from${frame(start)}to${frame(end)}`));
      }
      if (!fades && end.opacity !== 1) style.push(`opacity:${end.opacity}`);
      return layer.element(text, classes, style.join(';'));
    };
    return transitions
      .map(transition => {
        const {text, classes} = transition;
        if (transition.kind === 'leave') {
          const start = pose(transition.from, from);
          const fade = `0%{opacity:${start.opacity}}${percent(LEAVE_END)}{opacity:0}100%{opacity:0}`;
          return layer.element(text, classes, `${at(start)};${animate(fade)}`);
        }
        const end = pose(transition.to, to);
        if (transition.kind === 'enter') {
          const fade = `0%{opacity:0}${percent(ENTER_START)}{opacity:0}100%{opacity:${end.opacity}}`;
          return layer.element(text, classes, `${at(end)};${animate(fade)}`);
        }
        const start = pose(transition.from, from);
        if (transition.fromClasses === undefined) {
          return glide(text, classes, start, end);
        }
        return (
          glide(text, transition.fromClasses, start, {...end, opacity: 0}) +
          glide(text, classes, {...start, opacity: 0}, end)
        );
      })
      .join('');
  };

  const sizedBox = (id: string, width: (box: StepBox) => number) => {
    const size = (box: StepBox) =>
      `width:${px(width(box) * charWidth)};height:${px(box.rows * lineHeight)}`;
    return `position:relative;${size(to)};${animate(`from{${size(from)}}to{${size(to)}}`, id)}`;
  };

  const token: Layer['element'] = (text, classes, style) =>
    `<span class="${escapeAttribute(classes)}" style="position:absolute;white-space:pre;${style}">${escapeHtml(text)}</span>`;

  const code = compileLayer(scene.code, {
    place: (cell, box) => ({
      x: (cell.col + box.indent) * charWidth,
      y: cell.line * lineHeight,
    }),
    element: token,
  });
  const marks = compileLayer(scene.marks, {
    place: cell => ({x: 0, y: cell.line * lineHeight}),
    element: (_, kind, style) =>
      `<div data-mark="${escapeAttribute(kind)}" style="position:absolute;right:0;height:${px(lineHeight)};${style}"></div>`,
  });
  const gutter = scene.gutter
    ? compileLayer(scene.gutter, {
        place: cell => ({x: cell.col * charWidth, y: cell.line * lineHeight}),
        element: token,
      })
    : null;

  // Each layer sits in the box of the static layout that holds it, so the
  // theme's paddings place it. The diff signs in marks.css draw only inside a
  // diff root, and only added or removed marks have them.
  const html = [
    gutter === null
      ? ''
      : `<div class="cm-gutters" aria-hidden="true"><div class="cm-gutter cm-lineNumbers"><div class="cm-gutterElement" style="grid-row:1"><div style="${sizedBox(`${name}-gutter`, box => box.gutterColumns)}">${gutter}</div></div></div></div>`,
    `<div class="cm-content cm-lineWrapping"><div class="cm-line" style="position:relative"><div data-line-marks="true" data-line-diff="true" style="position:absolute;left:0;top:0;right:0;bottom:0">${marks}</div><div style="${sizedBox(`${name}-box`, box => box.columns)}">${code}</div></div></div>`,
  ].join('');
  return {html, css: keyframes.join('\n')};
}
