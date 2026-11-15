import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
export const row = style({display: 'contents'});
export const trigger = style({
  width: '100%',
  minHeight: '36px',
  justifyContent: 'space-between',
  gap: themeVars.spacing['2'],
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '@media': {'(max-width: 768px)': {minHeight: '40px'}},
});
export const content = style({
  position: 'fixed',
  zIndex: 41,
  left: themeVars.spacing['2'],
  top: themeVars.spacing['2'],
  display: 'flex',
  flexDirection: 'column',
  width: 'min(360px, calc(100vw - 24px))',
  maxHeight: 'calc(100dvh - 32px)',
  padding: themeVars.spacing['4'],
  borderRadius: themeVars.borderRadius.xl,
  background: c.panel.background,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
  '@media': {
    '(max-width: 768px)': {
      left: '8px',
      right: '8px',
      top: 'auto',
      bottom: '8px',
      width: 'auto',
      maxHeight: '45dvh',
    },
  },
});
export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: themeVars.spacing['3'],
  paddingBottom: themeVars.spacing['3'],
});
export const title = style({
  margin: 0,
  fontSize: themeVars.fontSize.sm,
  fontWeight: themeVars.fontWeight.semibold,
});
export const body = style({
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
});
globalStyle(`${content} *`, {boxSizing: 'border-box'});
globalStyle(`${body} [data-control] > div`, {
  minHeight: '40px',
  padding: '2px 0',
  alignItems: 'center',
  gridTemplateColumns: 'minmax(100px, 1fr) minmax(0, 1.5fr)',
});
globalStyle(`${body} [data-control] label`, {
  whiteSpace: 'nowrap',
  minHeight: '36px',
  height: 'auto',
  paddingLeft: 0,
  fontSize: themeVars.fontSize.sm,
});
globalStyle(`${body} [data-control] > div > div`, {minWidth: 0});

export const value = style({
  display: 'flex',
  alignItems: 'center',
  gap: themeVars.spacing['2'],
  minWidth: 0,
});
export const valueText = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const swatch = style({
  width: themeVars.spacing['6'],
  height: themeVars.spacing['6'],
  flexShrink: 0,
  objectFit: 'cover',
  borderRadius: themeVars.borderRadius.md,
});

// The selected window style's title bar, as the production picker showed it.
export const windowThumb = style({
  position: 'relative',
  width: '64px',
  height: '24px',
  flexShrink: 0,
  overflow: 'hidden',
  borderRadius: themeVars.borderRadius.md,
  background: c.input.backgroundColor,
});
export const windowThumbArt = style({
  position: 'absolute',
  top: '5px',
  left: '5px',
  width: '240px',
  zoom: 0.4,
  pointerEvents: 'none',
});
