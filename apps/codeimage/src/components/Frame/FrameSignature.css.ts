import {
  createVar,
  globalFontFace,
  style,
  styleVariants,
} from '@vanilla-extract/css';

// Inter ships with the app so that the signature looks the same on every
// machine and in the downloaded image, which embeds the fonts it finds here.
const signatureFont = 'CodeImage Signature';
globalFontFace(signatureFont, [
  {
    src: 'url("/assets/fonts/inter/inter-latin-wght-normal.woff2") format("woff2")',
    fontWeight: '100 900',
    fontDisplay: 'swap',
    unicodeRange:
      'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  },
  {
    src: 'url("/assets/fonts/inter/inter-latin-ext-wght-normal.woff2") format("woff2")',
    fontWeight: '100 900',
    fontDisplay: 'swap',
    unicodeRange:
      'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
  },
]);

const ink = createVar();
const muted = createVar();
const surface = createVar();
const edge = createVar();

/** Spans the bottom of the frame; the position only aligns the mark inside it. */
export const slot = style({
  position: 'absolute',
  left: '24px',
  right: '24px',
  bottom: '20px',
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
      [muted]: 'rgb(255 255 255 / 0.64)',
      [surface]: 'rgb(255 255 255 / 0.14)',
      [edge]: 'rgb(255 255 255 / 0.18)',
    },
  },
  light: {
    vars: {
      [ink]: 'rgb(14 14 18)',
      [muted]: 'rgb(14 14 18 / 0.56)',
      [surface]: 'rgb(255 255 255 / 0.66)',
      [edge]: 'rgb(14 14 18 / 0.08)',
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
    gap: '8px',
    fontSize: '18px',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    opacity: 0.74,
  },
]);

export const pill = style([
  mark,
  glass,
  {
    gap: '7px',
    height: '36px',
    padding: '0 15px',
    borderRadius: '999px',
    fontSize: '16px',
    fontWeight: 500,
    letterSpacing: '-0.005em',
  },
]);

// An icon is optically heavier than a letter, so the side it sits on gets less padding.
export const pillWithIcon = style({paddingLeft: '12px'});

export const card = style([
  mark,
  glass,
  {
    gap: '12px',
    padding: '10px 18px 10px 10px',
    borderRadius: '18px',
  },
]);

export const cardText = style({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  gap: '1px',
});

export const cardName = style({
  fontSize: '16px',
  fontWeight: 650,
  letterSpacing: '-0.015em',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const cardHandle = style({
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  minWidth: 0,
  fontSize: '14px',
  fontWeight: 450,
  color: muted,
});

export const avatar = style({
  width: '44px',
  height: '44px',
  flexShrink: 0,
  borderRadius: '50%',
  objectFit: 'cover',
  background: edge,
  boxShadow: `0 0 0 1px ${edge}`,
});

export const monogram = style([
  avatar,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: ink,
  },
]);

export const text = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const icon = style({
  flexShrink: 0,
  display: 'block',
});
