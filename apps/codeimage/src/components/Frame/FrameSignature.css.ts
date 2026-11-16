import {SIGNATURE_FONT} from '@core/configuration/signature-fonts';
import {
  createVar,
  fallbackVar,
  globalFontFace,
  style,
  styleVariants,
} from '@vanilla-extract/css';

const signatureFont = SIGNATURE_FONT.family;
globalFontFace(
  signatureFont,
  SIGNATURE_FONT.faces.map(face => ({
    src: `url("${face.path}") format("woff2")`,
    fontWeight: '100 900',
    fontDisplay: 'swap',
    unicodeRange: face.unicodeRange,
  })),
);

/**
 * How much bigger the signature is than at a 640px frame. The frame sets it
 * from its width; previews outside a frame draw it at 1.
 */
export const signatureScale = createVar();
// Exported as a string: a .css.ts file may not export functions in the
// Node renderer's emitCss build.
export const scale = fallbackVar(signatureScale, '1');
/** A length that grows with the frame. */
const px = (value: number) => `calc(${value}px * ${scale})`;

const ink = createVar();
const muted = createVar();
const surface = createVar();
const edge = createVar();
const ring = createVar();
const halo = createVar();

/** Spans the bottom of the frame; the position only aligns the mark inside it. */
export const slot = style({
  position: 'absolute',
  left: px(24),
  right: px(24),
  bottom: px(20),
  display: 'flex',
  pointerEvents: 'none',
  zIndex: 2,
});

export const align = styleVariants({
  'bottom-left': {justifyContent: 'flex-start'},
  'bottom-center': {justifyContent: 'center'},
  'bottom-right': {justifyContent: 'flex-end'},
});

// The surface is a translucent fill with no backdrop blur: the downloaded
// image cannot draw a backdrop filter, and the editor shows what it exports.
export const tone = styleVariants({
  dark: {
    vars: {
      [ink]: 'rgb(255 255 255)',
      [muted]: 'rgb(255 255 255 / 0.76)',
      [surface]: 'rgb(255 255 255 / 0.16)',
      [edge]: 'rgb(255 255 255 / 0.2)',
      [ring]: 'rgb(255 255 255 / 0.4)',
      [halo]: '0 1px 2px rgb(0 0 0 / 0.22)',
    },
  },
  light: {
    vars: {
      [ink]: 'rgb(14 14 18)',
      [muted]: 'rgb(14 14 18 / 0.66)',
      [surface]: 'rgb(255 255 255 / 0.7)',
      [edge]: 'rgb(14 14 18 / 0.08)',
      [ring]: 'rgb(255 255 255 / 0.9)',
      [halo]: 'none',
    },
  },
});

// An uploaded image can be busy anywhere, so over one the surfaces get a
// denser scrim and the bare text a stronger halo. Declared after `tone`, so
// it wins where both set a variable.
export const imageTone = styleVariants({
  dark: {
    vars: {
      [muted]: 'rgb(255 255 255 / 0.8)',
      [surface]: 'rgb(16 16 20 / 0.66)',
      [edge]: 'rgb(255 255 255 / 0.14)',
      [ring]: 'rgb(255 255 255 / 0.5)',
      [halo]: '0 1px 3px rgb(0 0 0 / 0.65), 0 0 1px rgb(0 0 0 / 0.5)',
    },
  },
  light: {
    vars: {
      [muted]: 'rgb(14 14 18 / 0.72)',
      [surface]: 'rgb(255 255 255 / 0.88)',
      [edge]: 'rgb(14 14 18 / 0.1)',
      [ring]: 'rgb(255 255 255 / 0.95)',
      [halo]: '0 0 3px rgb(255 255 255 / 0.9)',
    },
  },
});

const mark = style({
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  maxWidth: '100%',
  boxSizing: 'border-box',
  fontFamily: `"${signatureFont}", system-ui, sans-serif`,
  color: ink,
  whiteSpace: 'nowrap',
  lineHeight: 1.25,
});

const glass = style({
  background: surface,
  boxShadow: `inset 0 0 0 1px ${edge}, 0 1px 3px rgb(0 0 0 / 0.08)`,
});

export const minimal = style([
  mark,
  {
    // Close to full ink, a step heavier, and a soft halo on dark fills, so
    // it holds on a busy image without a surface of its own.
    gap: px(8),
    fontSize: px(19),
    fontWeight: 600,
    letterSpacing: '-0.012em',
    opacity: 0.92,
    textShadow: halo,
  },
]);

export const pill = style([
  mark,
  glass,
  {
    gap: px(7),
    height: px(36),
    padding: `0 ${px(15)}`,
    borderRadius: '999px',
    fontSize: px(16),
    fontWeight: 500,
    letterSpacing: '-0.005em',
  },
]);

// An icon is optically heavier than a letter, so the side it sits on gets less padding.
export const pillWithIcon = style({paddingLeft: px(12)});

export const card = style([
  mark,
  glass,
  {
    gap: px(12),
    padding: `${px(10)} ${px(18)} ${px(10)} ${px(10)}`,
    borderRadius: px(18),
  },
]);

export const cardText = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  gap: px(1),
});

export const cardName = style({
  fontSize: px(16),
  fontWeight: 650,
  letterSpacing: '-0.015em',
});

export const cardHandle = style({
  display: 'flex',
  alignItems: 'center',
  gap: px(5),
  minWidth: 0,
  fontSize: px(14),
  fontWeight: 500,
  color: muted,
});

/** The platform icon beside a muted handle keeps the full ink. */
export const cardIcon = style({
  flexShrink: 0,
  display: 'block',
  color: ink,
});

export const avatar = style({
  width: px(44),
  height: px(44),
  flexShrink: 0,
  borderRadius: '50%',
  objectFit: 'cover',
  background: edge,
  // A clear ring, so the avatar keeps its edge on a busy background.
  boxShadow: `0 0 0 ${px(2)} ${ring}, 0 1px 3px rgb(0 0 0 / 0.18)`,
});

export const monogram = style([
  avatar,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: px(16),
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: ink,
  },
]);

// The download freezes each element at its measured width and then draws
// text a fraction wider, which would cut a name that fits. So the ellipsis
// is drawn only where the editor measured a real overflow (`FitText`).
export const text = style({
  minWidth: 0,
  whiteSpace: 'nowrap',
  selectors: {
    '&[data-overflow]': {overflow: 'hidden', textOverflow: 'ellipsis'},
  },
});

export const icon = style({
  flexShrink: 0,
  display: 'block',
});

// In the editor the signature is a button that opens its settings. It draws
// a ring that follows the mark's shape on hover and on keyboard focus, and
// nothing at rest, so the canvas shows what the download shows.
export const edit = style({
  all: 'unset',
  boxSizing: 'border-box',
  display: 'flex',
  minWidth: 0,
  maxWidth: '100%',
  pointerEvents: 'auto',
  cursor: 'pointer',
  borderRadius: px(10),
  outline: '2px solid transparent',
  outlineOffset: px(5),
  transition: 'outline-color 150ms ease',
  selectors: {
    '&[data-signature-style="pill"]': {borderRadius: '999px'},
    '&[data-signature-style="card"]': {borderRadius: px(18)},
    '&:focus-visible': {outlineColor: 'rgb(56 132 255)'},
  },
  '@media': {
    '(hover: hover) and (pointer: fine)': {
      selectors: {'&:hover': {outlineColor: muted}},
    },
    '(prefers-reduced-motion: reduce)': {transition: 'none'},
  },
});
