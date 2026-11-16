import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
export const island = style({
  width: 'calc(100% - 24px)',
  maxWidth: 1100,
  minWidth: 0,
  minHeight: 0,
  maxHeight: 'max(60dvh, 300px)',
  margin: '0 auto 12px',
  boxSizing: 'border-box',
  flexShrink: 0,
  padding: '12px 16px',
  borderRadius: themeVars.borderRadius.xl,
  background: c.dialog.panelBackgroundColor,
  color: c.baseText,
  boxShadow: c.dialog.panelShadow,
  display: 'grid',
  gridTemplateRows: 'max-content minmax(0, 1fr)',
  gap: 10,
  fontSize: themeVars.fontSize.sm,
  selectors: {
    '&[data-compact]': {
      gridTemplateRows:
        'max-content max-content max-content minmax(40px, 1fr) max-content',
    },
  },
  '@media': {
    '(max-width: 768px)': {padding: 12, width: 'calc(100% - 16px)', gap: 8},
  },
});
// Menu triggers stay outside scrolling ancestors; only the content can scroll.
export const body = style({
  minHeight: 0,
  display: 'grid',
  gridAutoRows: 'max-content',
  gap: 10,
  overflowY: 'auto',
  selectors: {'&[data-compact]': {display: 'contents', overflowY: 'visible'}},
});
globalStyle(
  `${island} [data-cui="button"], ${island} [data-cui="icon-button"], ${island} [aria-haspopup="listbox"]`,
  {
    '@media': {'(max-width: 768px)': {minHeight: 40, minWidth: 40}},
  },
);
export const transport = style({
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: c.dialog.panelBackgroundColor,
  minWidth: 0,
  display: 'flex',
  flexWrap: 'wrap',
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
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});
export const title = style({width: 160, minWidth: 0});
globalStyle(`${transport} button, ${header} button, ${header} input`, {
  minWidth: 36,
  minHeight: 36,
  flexShrink: 0,
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
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
});
export const number = style({
  position: 'relative',
  width: 110,
  selectors: {
    '&[data-compact]': {display: 'flex', gap: 8, width: 228, maxWidth: '100%'},
  },
});
export const hint = style({margin: 0, opacity: 0.7, fontSize: 12});

globalStyle(`${island} input`, {
  '@media': {'(max-width: 768px)': {minHeight: 40}},
});
globalStyle(`${number} input`, {
  paddingRight: 28,
});
globalStyle(`${number}[data-compact] > :first-child`, {flex: 1, minWidth: 0});
globalStyle(`${number}[data-compact] input`, {paddingRight: 8});
export const durationSteppers = style({
  position: 'absolute',
  right: 4,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
});
globalStyle(`${number}[data-compact] ${durationSteppers}`, {
  position: 'static',
  transform: 'none',
  flexDirection: 'row',
  flexShrink: 0,
});
globalStyle(`${durationSteppers} button`, {
  height: 14,
  minHeight: 14,
  width: 20,
  minWidth: 20,
  padding: 0,
});
globalStyle(`${number}[data-compact] ${durationSteppers} button`, {
  height: 40,
  minHeight: 40,
  width: 40,
  minWidth: 40,
});
globalStyle(`${number} button svg`, {
  width: 12,
  height: 12,
  '@media': {'(max-width: 768px)': {width: 16, height: 16}},
});
globalStyle('[data-animation-steps-menu] [role="menuitem"]', {
  '@media': {'(max-width: 768px)': {minHeight: 40, minWidth: 40}},
});
globalStyle('[data-animation-steps-menu][role="menu"]', {
  maxHeight: 'var(--kb-popper-content-available-height)',
  maxWidth: 'min(calc(100vw - 16px), var(--kb-popper-content-available-width))',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
});
