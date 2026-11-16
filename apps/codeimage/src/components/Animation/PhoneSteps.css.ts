import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
export const columns = style({
  display: 'grid',
  gridTemplateColumns: '20px minmax(0, 1fr) 88px 64px',
  gap: 6,
  padding: '0 8px',
  fontSize: 11,
  opacity: 0.65,
});
export const list = style({
  listStyle: 'none',
  padding: 0,
  margin: 0,
  minHeight: 40,
  maxHeight: 'min(208px, 26vh)',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  scrollbarWidth: 'thin',
});
export const row = style({
  display: 'grid',
  gridTemplateColumns: '20px minmax(0, 1fr) 88px 64px',
  alignItems: 'center',
  gap: 6,
  width: '100%',
  minHeight: 40,
  padding: '0 8px',
  border: 0,
  borderRadius: themeVars.borderRadius.md,
  background: 'transparent',
  color: c.baseText,
  font: 'inherit',
  fontSize: 12,
  textAlign: 'left',
  cursor: 'pointer',
  selectors: {
    '&:hover': {background: c.panel.background},
    '&[data-selected]': {
      background: c.panel.background,
      boxShadow: `inset 0 0 0 2px ${c.primary}`,
    },
    '&[data-current]': {borderLeft: `3px solid ${c.primary}`},
    '&:focus-visible': {outline: `2px solid ${c.primary}`, outlineOffset: -2},
  },
});
export const index = style({opacity: 0.65, fontVariantNumeric: 'tabular-nums'});
export const name = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const metric = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 4,
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 11,
});
export const footer = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
});
export const add = style({
  justifyContent: 'flex-start',
  minHeight: 40,
});
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 43,
  background: c.dialog.overlayBackgroundColor,
});
export const sheet = style({
  position: 'fixed',
  zIndex: 44,
  left: 0,
  right: 0,
  bottom: 0,
  maxHeight: '85dvh',
  overflowY: 'auto',
  padding: '16px 16px max(16px, env(safe-area-inset-bottom))',
  display: 'grid',
  gap: 16,
  borderRadius: `${themeVars.borderRadius.xl} ${themeVars.borderRadius.xl} 0 0`,
  background: c.dialog.panelBackgroundColor,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
  fontSize: themeVars.fontSize.sm,
});
export const heading = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
});
export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
});
export const hint = style({margin: 0, fontSize: 12});
globalStyle(`${sheet} button, ${sheet} input`, {minHeight: 40, minWidth: 40});
globalStyle(`${sheet} h2`, {margin: 0, fontSize: themeVars.fontSize.base});
