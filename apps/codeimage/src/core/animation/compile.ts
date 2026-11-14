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
export const LEAVE_END = 0.3;
export const ENTER_START = 0.7;

// Matches the focus dimming in marks.css.
const DIM_OPACITY = 0.35;

const px = (value: number) => `${Number(value.toFixed(3))}px`;
const percent = (ratio: number) => `${ratio * 100}%`;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (text: string) =>
  escapeHtml(text).replace(/"/g, '&quot;');

type Point = {x: number; y: number};

type Layer = {
  place: (cell: Cell, box: StepBox) => Point;
  element: (transition: TokenTransition, style: string) => string;
};

export function compileScene(
  scene: Scene,
  metrics: CodeMetrics,
  timing: SceneTiming,
  name = 'a',
): {html: string; css: string} {
  const {charWidth, lineHeight} = metrics;
  const {from, to} = scene;
  const animation = (id: string) =>
    `animation:${id} ${timing.transitionMs}ms ${EASING_CURVES[timing.easing]} ${-(timing.offsetMs ?? 0)}ms both`;
  const opacity = (box: StepBox, cell: Cell) =>
    box.dimmed.has(cell.line) ? DIM_OPACITY : 1;
  const keyframes: string[] = [];
  let count = 0;

  const compileLayer = (transitions: TokenTransition[], layer: Layer) =>
    transitions
      .map(transition => {
        const id = `${name}-${count++}`;
        const cell =
          transition.kind === 'leave' ? transition.from : transition.to;
        const box = transition.kind === 'leave' ? from : to;
        const {x, y} = layer.place(cell, box);
        let style = `left:${px(x)};top:${px(y)}`;
        if (transition.kind === 'leave') {
          keyframes.push(
            `@keyframes ${id}{0%{opacity:${opacity(from, transition.from)}}${percent(LEAVE_END)}{opacity:0}100%{opacity:0}}`,
          );
          style += `;${animation(id)}`;
        } else if (transition.kind === 'enter') {
          keyframes.push(
            `@keyframes ${id}{0%{opacity:0}${percent(ENTER_START)}{opacity:0}100%{opacity:${opacity(to, transition.to)}}}`,
          );
          style += `;${animation(id)}`;
        } else {
          // Takumi rounds layout positions to device pixels but not
          // transforms, so a move animates `left` and `top`. Both endpoints
          // then land on the pixels the static layout uses.
          const start = layer.place(transition.from, from);
          const startOpacity = opacity(from, transition.from);
          const endOpacity = opacity(to, transition.to);
          const fade = startOpacity !== endOpacity;
          if (start.x !== x || start.y !== y || fade) {
            const fromOpacity = fade ? `;opacity:${startOpacity}` : '';
            const toOpacity = fade ? `;opacity:${endOpacity}` : '';
            keyframes.push(
              `@keyframes ${id}{from{left:${px(start.x)};top:${px(start.y)}${fromOpacity}}to{left:${px(x)};top:${px(y)}${toOpacity}}}`,
            );
            style += `;${animation(id)}`;
          }
          if (!fade && endOpacity !== 1) style += `;opacity:${endOpacity}`;
        }
        return layer.element(transition, style);
      })
      .join('');

  const sizedBox = (id: string, width: (box: StepBox) => number) => {
    const size = (box: StepBox) =>
      `width:${px(width(box) * charWidth)};height:${px(box.rows * lineHeight)}`;
    keyframes.push(`@keyframes ${id}{from{${size(from)}}to{${size(to)}}}`);
    return `position:relative;${size(to)};${animation(id)}`;
  };

  const token: Layer['element'] = (transition, style) =>
    `<span class="${escapeAttribute(transition.classes)}" style="position:absolute;white-space:pre;${style}">${escapeHtml(transition.text)}</span>`;

  const code = compileLayer(scene.code, {
    place: (cell, box) => ({
      x: (cell.col + box.indent) * charWidth,
      y: cell.line * lineHeight,
    }),
    element: token,
  });
  const marks = compileLayer(scene.marks, {
    place: cell => ({x: 0, y: cell.line * lineHeight}),
    element: (transition, style) =>
      `<div data-mark="${escapeAttribute(transition.classes)}" style="position:absolute;right:0;height:${px(lineHeight)};${style}"></div>`,
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
