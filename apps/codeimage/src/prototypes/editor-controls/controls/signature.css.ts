import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const reducedMotion = '(prefers-reduced-motion: reduce)';
const finePointer = '(hover: hover) and (pointer: fine)';
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const focusRing = {
  outline: `2px solid ${c.primary}`,
  outlineOffset: '2px',
} as const;

export const field = style({
  position: 'relative',
  width: '100%',
});

// Style tiles: each style on a small copy of the frame's background, at the
// place the frame will show it, so the choice is made by looking.

export const tiles = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '8px',
  width: '100%',
});

export const tile = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  padding: '4px 4px 7px',
  borderRadius: '14px',
  background: c.input.backgroundColor,
  cursor: 'pointer',
  transition: `transform 160ms ${easeOut}`,
  selectors: {
    '&[data-checked]': {boxShadow: `inset 0 0 0 2px ${c.primary}`},
    '&:has(input:focus-visible)': focusRing,
    '&:active': {transform: 'scale(0.97)'},
  },
  '@media': {[reducedMotion]: {transition: 'none'}},
});

export const tileLabel = style({
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  cursor: 'pointer',
});

export const swatch = style({
  position: 'relative',
  height: '58px',
  overflow: 'hidden',
  borderRadius: '10px',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  pointerEvents: 'none',
});

/** The mark at half size, where the frame puts it. */
export const swatchMark = style({
  position: 'absolute',
  left: '6px',
  right: '6px',
  bottom: '6px',
  display: 'flex',
  zoom: 0.5,
  selectors: {
    '&[data-position="bottom-left"]': {justifyContent: 'flex-start'},
    '&[data-position="bottom-center"]': {justifyContent: 'center'},
    '&[data-position="bottom-right"]': {justifyContent: 'flex-end'},
  },
});

export const tileCaption = style({
  paddingLeft: '6px',
  fontSize: themeVars.fontSize.xs,
  fontWeight: 500,
  color: c.descriptionTextColor,
  pointerEvents: 'none',
  transition: 'color 120ms ease',
  selectors: {[`${tile}[data-checked] &`]: {color: c.baseText}},
  '@media': {
    [finePointer]: {selectors: {[`${tile}:hover &`]: {color: c.baseText}}},
  },
});

export const glyph = style({display: 'block', margin: '0 auto'});

// Avatar: the choice, and the uploaded image beside it.

export const avatarRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
});

export const avatarChoice = style({flex: 1, minWidth: 0});

export const avatarThumb = style({
  position: 'relative',
  flexShrink: 0,
  width: '32px',
  height: '32px',
  padding: 0,
  border: 0,
  borderRadius: '50%',
  overflow: 'hidden',
  background: c.input.backgroundColor,
  cursor: 'pointer',
  transition: `transform 160ms ${easeOut}`,
  selectors: {
    '&:focus-visible': focusRing,
    '&:active': {transform: 'scale(0.95)'},
  },
  '@media': {[reducedMotion]: {transition: 'none'}},
});

export const avatarImage = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});
