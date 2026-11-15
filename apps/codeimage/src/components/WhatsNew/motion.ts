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
  minimize: 200,
  coachmarkIn: 180,
  coachmarkOut: 120,
  nudgeIn: 400,
  nudgeOut: 200,
  reveal: 260,
  step: 200,
  /** When a picture starts explaining, after its step or card has settled. */
  playAt: 220,
} as const;

/**
 * The Showcase's entrance: when each part starts, in ms from the sheet
 * opening. The title leads. The gaps shrink down the sheet, so the parts
 * arrive as one wave, and a card past the fifth keeps the fifth's time.
 */
export const showcaseAt = {
  title: 0,
  subtitle: 80,
  cards: [160, 240, 300, 340, 370],
  footer: 400,
  /** A card's picture starts explaining this long after its card. */
  play: 350,
} as const;

/** How long each part of the Showcase takes to arrive. */
export const showcaseFor = {
  sheet: 250,
  lead: 550,
  support: 500,
  card: 450,
  fade: 400,
} as const;

/** One-shot illustration parts, in milliseconds after playAt. */
export const illustrationFor = {
  redact: 450,
  tabs: 360,
  shortcut: 240,
  commandPick: 420,
  layout: 360,
  theme: 360,
  engine: 360,
} as const;

export const illustrationAt = {
  redact: 150,
  tabs: [0, 90, 160],
  shortcut: 0,
  commandPick: 180,
  layout: [0, 110, 190],
  theme: [0, 90, 150],
  engine: [0, 120, 220],
} as const;

export const ms = (value: number) => `${value}ms`;

export const reduceMotion = '(prefers-reduced-motion: reduce)';

/** A click from Enter or Space has no pointer. Keyboard actions do not animate. */
export const fromKeyboard = (event: MouseEvent) => event.detail === 0;
