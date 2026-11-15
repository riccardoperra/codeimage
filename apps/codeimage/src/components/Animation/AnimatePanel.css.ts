import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
export const island = style({
  width: 'calc(100% - 24px)',
  maxWidth: 1100,
  minWidth: 0,
  margin: '0 auto 12px',
  boxSizing: 'border-box',
  flexShrink: 0,
  padding: '12px 16px',
  borderRadius: themeVars.borderRadius.xl,
  background: c.dialog.panelBackgroundColor,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
  display: 'grid',
  gap: 10,
  fontSize: themeVars.fontSize.sm,
  '@media': {
    '(max-width: 768px)': {padding: 12, width: 'calc(100% - 16px)', gap: 8},
  },
});
globalStyle(
  `${island} [data-cui="button"], ${island} [data-cui="icon-button"], ${island} [aria-haspopup="listbox"]`,
  {
    '@media': {'(max-width: 768px)': {minHeight: 40}},
  },
);
export const transport = style({
  minWidth: 0,
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  minHeight: 36,
  '@media': {'(max-width: 768px)': {minHeight: 40}},
});
export const time = style({
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
  minWidth: '19ch',
  fontSize: 12,
  '@media': {'(max-width: 768px)': {minWidth: 0, flex: 1}},
});
export const spacer = style({
  flex: 1,
  '@media': {'(max-width: 768px)': {display: 'none'}},
});
export const header = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});
export const title = style({width: 160, minWidth: 0});
export const desktopHeader = style({
  '@media': {'(max-width: 768px)': {display: 'none'}},
});
export const mobileHeader = style({
  display: 'none',
  '@media': {'(max-width: 768px)': {display: 'block'}},
});
export const details = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
  minHeight: 36,
  '@media': {'(max-width: 768px)': {minHeight: 40}},
});
export const field = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});
export const number = style({width: 110});
export const hint = style({margin: 0, opacity: 0.7, fontSize: 12});
