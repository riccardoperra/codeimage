/**
 * The motion of What's new. Its styles and the timers that wait for an exit
 * read these values, so the two cannot drift apart. The curves are the ones
 * the editor already uses for `easeOut` and for its drawers. The README of
 * the editor-controls prototype says which element uses which.
 */
export const curve = {
  /** Anything that answers a click, and every exit. */
  out: 'cubic-bezier(0.23, 1, 0.32, 1)',
  /** A part of a picture moving on screen to explain a feature. */
  inOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
  /** The Nudge arriving on its own, as a toast does. */
  toast: 'ease',
} as const;

/** Milliseconds. */
export const duration = {
  press: 120,
  coachmarkIn: 180,
  coachmarkOut: 120,
  nudgeIn: 400,
  nudgeOut: 200,
  reveal: 260,
  step: 200,
} as const;

export const ms = (value: number) => `${value}ms`;

export const reduceMotion = '(prefers-reduced-motion: reduce)';

/** A click from Enter or Space has no pointer. Keyboard actions do not animate. */
export const fromKeyboard = (event: MouseEvent) => event.detail === 0;
