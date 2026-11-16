import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
import {curve} from '../../WhatsNew/motion';

const c = themeVars.dynamicColors;
const phone = '(max-width: 768px)';
const hover = '(hover: hover) and (pointer: fine)';

export const root = style({
  position: 'relative',
  maxHeight: 236,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: 2,
  scrollbarWidth: 'thin',
  '@media': {[phone]: {maxHeight: '38vh'}},
});
export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  userSelect: 'none',
});
export const tab = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  borderRadius: themeVars.borderRadius.lg,
  selectors: {
    '&[data-dragging]': {
      zIndex: 4,
      background: c.dialog.panelBackgroundColor,
      boxShadow: c.dialog.panelShadow,
    },
  },
});

const rowBase = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  boxSizing: 'border-box',
  border: 0,
  borderRadius: themeVars.borderRadius.lg,
  background: 'transparent',
  color: c.baseText,
  font: 'inherit',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  cursor: 'pointer',
} as const;

export const row = style({
  ...rowBase,
  height: 40,
  padding: '0 8px 0 4px',
  fontSize: 13,
  selectors: {
    '&[data-current]': {background: c.panel.background},
    '&:focus-visible': {outline: `2px solid ${c.primary}`, outlineOffset: -2},
  },
  '@media': {
    [hover]: {selectors: {'&:hover': {background: c.panel.background}}},
  },
});
export const tabRow = style({background: c.background});
export const stepRow = style({paddingLeft: 44, height: 36});
export const transitionRow = style({
  ...rowBase,
  height: 28,
  padding: '0 8px 0 44px',
  fontSize: 12,
  opacity: 0.8,
  fontVariantNumeric: 'tabular-nums',
  selectors: {
    '&[data-current]': {opacity: 1, background: c.panel.background},
    '&:focus-visible': {outline: `2px solid ${c.primary}`, outlineOffset: -2},
  },
  '@media': {
    [phone]: {height: 40},
    [hover]: {
      selectors: {'&:hover': {opacity: 1, background: c.panel.background}},
    },
  },
});
export const betweenTabs = style({paddingLeft: 12});
globalStyle(`${transitionRow} svg`, {width: 18, height: 16, flexShrink: 0});

export const grip = style({
  display: 'grid',
  placeItems: 'center',
  width: 28,
  height: 28,
  flexShrink: 0,
  borderRadius: themeVars.borderRadius.md,
  opacity: 0.5,
  cursor: 'grab',
  touchAction: 'none',
  '@media': {[phone]: {width: 40, height: 40}},
});
export const number = style({
  display: 'grid',
  placeItems: 'center',
  minWidth: 22,
  height: 22,
  padding: '0 4px',
  borderRadius: 6,
  background: c.panel.background,
  fontSize: 12,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
});
export const name = style({fontWeight: 600});
export const meta = style({
  opacity: 0.65,
  fontSize: 12,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
export const time = style({
  marginLeft: 'auto',
  opacity: 0.65,
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
});
export const add = style({
  display: 'grid',
  placeItems: 'center',
  minWidth: 28,
  height: 28,
  padding: '0 10px',
  flexShrink: 0,
  border: 0,
  borderRadius: themeVars.borderRadius.md,
  background: 'transparent',
  color: c.baseText,
  font: 'inherit',
  fontSize: 12,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  transition: `transform 160ms ${curve.out}`,
  selectors: {
    '&:active': {transform: 'scale(0.97)'},
    '&:focus-visible': {outline: `2px solid ${c.primary}`},
  },
  '@media': {
    [phone]: {minWidth: 40, height: 40},
    [hover]: {selectors: {'&:hover': {background: c.panel.background}}},
  },
});
export const addTab = style({
  ...rowBase,
  height: 36,
  padding: '0 12px',
  fontSize: 13,
  opacity: 0.7,
  selectors: {
    '&:disabled': {opacity: 0.3, cursor: 'default'},
    '&:focus-visible': {outline: `2px solid ${c.primary}`, outlineOffset: -2},
  },
  '@media': {
    [phone]: {height: 40},
    [hover]: {selectors: {'&:not(:disabled):hover': {opacity: 1}}},
  },
});
export const rowButton = style({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flex: 1,
  minWidth: 0,
  height: '100%',
  padding: 0,
  border: 0,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  overflow: 'hidden',
  selectors: {
    '&:focus-visible': {outline: `2px solid ${c.primary}`, borderRadius: 6},
  },
});

globalStyle(
  `[data-animate-input="keyboard"] ${row}, [data-animate-input="keyboard"] ${transitionRow}, [data-animate-input="keyboard"] ${add}, [data-animate-input="keyboard"] ${addTab}`,
  {transition: 'none', animation: 'none'},
);
