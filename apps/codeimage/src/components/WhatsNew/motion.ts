/**
 * The motion of What's new. Its styles and the timers that wait for an exit
 * read these values, so the two cannot drift apart. The curves are the ones
 * the editor already uses for `easeOut` and for its drawers.
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
 * opening. The title leads; cards rise in registry order at a 45ms stagger.
 */
export const showcaseAt = {
  title: 0,
  subtitle: 80,
  cards: 160,
  stagger: 45,
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

/**
 * How long each one-shot part of a picture takes. A picture plays once, when
 * it enters the viewport, and ends on the drawing its `still` mode shows.
 */
export const illustrationFor = {
  /** A part arriving in its place. */
  arrive: 360,
  /** A line mark's wash crossing its row. */
  wipe: 420,
  /** One dot replacing a character of the secret. */
  redact: 260,
  /** The engine switch moving to Takumi. */
  engine: 420,
  /** The command being typed in the terminal. */
  type: 480,
  /** A signature landing on the image. */
  stamp: 320,
  /** The playhead crossing the first step. */
  playhead: 900,
  /** The code moving from one step to the next. */
  morph: 450,
} as const;

/** When each part starts, in milliseconds after the picture starts playing. */
export const illustrationAt = {
  /** Three parts in a row: 30 to 80ms apart, never uniform. */
  stagger: [0, 70, 130],
  markAdded: 140,
  /** Between two dots of the redacted secret. */
  redactDot: 28,
  engineWire: 260,
  /** The terminal answers once the command is typed. */
  cliDone: 520,
  /** The playhead reaches the second step. */
  morph: 620,
} as const;

export const ms = (value: number) => `${value}ms`;

export const reduceMotion = '(prefers-reduced-motion: reduce)';

/** A click from Enter or Space has no pointer. Keyboard actions do not animate. */
export const fromKeyboard = (event: MouseEvent) => event.detail === 0;
