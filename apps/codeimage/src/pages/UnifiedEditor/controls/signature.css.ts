import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const reducedMotion = '(prefers-reduced-motion: reduce)';
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
const focusRing = {
  outline: `2px solid ${c.primary}`,
  outlineOffset: '2px',
} as const;

export const field = style({
  position: 'relative',
  width: '100%',
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

// The source selector and account share one field background.

export const profile = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '100%',
  minWidth: 0,
});

export const prefixed = style({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minWidth: 0,
  borderRadius: themeVars.borderRadius.lg,
  background: c.input.backgroundColor,
  // The field's own focus border, drawn on the whole row with its prefix.
  boxShadow: 'inset 0 0 0 1px transparent',
  selectors: {'&:focus-within': {boxShadow: `inset 0 0 0 1px ${c.primary}`}},
});

export const prefix = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  flexShrink: 0,
  fontSize: themeVars.fontSize.sm,
  color: c.descriptionTextColor,
  whiteSpace: 'nowrap',
  userSelect: 'none',
});

globalStyle(`${prefix} button`, {
  width: 'auto',
  padding: '0 4px 0 8px',
  gap: '2px',
  background: 'transparent',
  boxShadow: 'none',
  color: c.descriptionTextColor,
});

export const prefixedRoot = style({flex: 1, minWidth: 0});

export const prefixedInput = style({
  background: 'transparent !important',
  boxShadow: 'none !important',
  outline: 'none !important',
  borderColor: 'transparent !important',
  paddingLeft: '2px !important',
});

export const hint = style({
  fontSize: themeVars.fontSize.xs,
  lineHeight: 1.4,
  color: c.descriptionTextColor,
  selectors: {'&[data-tone="warning"]': {color: c.baseText}},
});

// The hint under the profile field makes the row taller; the label stays
// level with the field, not with the middle of the row.
globalStyle('[data-control="signature.profile"] label', {
  alignSelf: 'start',
});
