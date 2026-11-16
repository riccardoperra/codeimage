import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {curve} from '../../WhatsNew/motion';

const c = themeVars.dynamicColors;
const phone = '(max-width: 768px)';
const hover = '(hover: hover) and (pointer: fine)';

export const root = style({
  position: 'relative',
  overflowX: 'auto',
  overflowY: 'hidden',
  padding: '4px 4px 8px',
  scrollbarWidth: 'thin',
});
export const row = style({
  display: 'flex',
  alignItems: 'flex-end',
  gap: 8,
  width: 'max-content',
});
export const tab = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 8,
  borderRadius: themeVars.borderRadius.xl,
  background: c.background,
  selectors: {
    '&[data-dragging]': {
      zIndex: 4,
      boxShadow: c.dialog.panelShadow,
      cursor: 'grabbing',
    },
  },
});
export const tabHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 28,
  padding: '0 4px',
  fontSize: 13,
  cursor: 'grab',
  touchAction: 'none',
  userSelect: 'none',
  '@media': {[phone]: {height: 40}},
});
export const tabNumber = style({
  display: 'grid',
  placeItems: 'center',
  minWidth: 20,
  height: 20,
  padding: '0 4px',
  borderRadius: 6,
  background: c.panel.background,
  fontSize: 12,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
});
export const tabName = style({fontWeight: 600, whiteSpace: 'nowrap'});
export const tabMeta = style({
  opacity: 0.6,
  fontSize: 12,
  whiteSpace: 'nowrap',
});
export const cards = style({display: 'flex', alignItems: 'center', gap: 6});

export const card = style([
  {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: 136,
    height: 96,
    flexShrink: 0,
    boxSizing: 'border-box',
    padding: 8,
    border: 0,
    borderRadius: themeVars.borderRadius.lg,
    background: c.panel.background,
    color: c.baseText,
    font: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: `transform 160ms ${curve.out}`,
    selectors: {
      '&:active': {transform: 'scale(0.98)'},
      '&[data-current]': {background: c.dialog.panelBackgroundColor},
      '&:focus-visible': {outline: `2px solid ${c.primary}`, outlineOffset: 2},
    },
    '@media': {[phone]: {width: 120, height: 92}},
  },
  {
    selectors: {
      '[data-animate-input="keyboard"] &': {
        transition: 'none',
        animation: 'none',
      },
    },
  },
]);
export const cardHead = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  fontSize: 12,
  whiteSpace: 'nowrap',
});
export const cardNumber = style({
  fontWeight: 700,
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
});
export const cardSummary = style({
  opacity: 0.75,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
export const code = style({
  flex: 1,
  minHeight: 0,
  margin: 0,
  overflow: 'hidden',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 5.5,
  lineHeight: '7px',
  whiteSpace: 'pre',
  opacity: 0.8,
});

export const chip = style([
  {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    height: 28,
    flexShrink: 0,
    padding: '0 8px 0 4px',
    border: 0,
    borderRadius: 999,
    background: 'transparent',
    color: c.baseText,
    font: 'inherit',
    fontSize: 12,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    opacity: 0.8,
    transition: `transform 160ms ${curve.out}`,
    selectors: {
      '&:active': {transform: 'scale(0.97)'},
      '&[data-current]': {opacity: 1, background: c.panel.background},
      '&:focus-visible': {outline: `2px solid ${c.primary}`},
    },
    '@media': {
      [phone]: {height: 40},
      [hover]: {
        selectors: {'&:hover': {opacity: 1, background: c.panel.background}},
      },
    },
  },
  {
    selectors: {
      '[data-animate-input="keyboard"] &': {
        transition: 'none',
        animation: 'none',
      },
    },
  },
]);
export const between = style({alignSelf: 'center', marginTop: 34});

export const add = style({
  display: 'grid',
  placeItems: 'center',
  width: 32,
  height: 96,
  flexShrink: 0,
  border: `1px dashed ${c.divider}`,
  borderRadius: themeVars.borderRadius.lg,
  background: 'transparent',
  color: c.baseText,
  font: 'inherit',
  fontSize: 16,
  opacity: 0.7,
  cursor: 'pointer',
  transition: `transform 160ms ${curve.out}`,
  selectors: {
    '&:active': {transform: 'scale(0.97)'},
    '&:disabled': {opacity: 0.3, cursor: 'default'},
    '&:focus-visible': {outline: `2px solid ${c.primary}`},
  },
  '@media': {
    [phone]: {width: 40, height: 92},
    [hover]: {selectors: {'&:not(:disabled):hover': {opacity: 1}}},
  },
});
export const ghost = style([
  add,
  {
    width: 136,
    placeItems: 'stretch',
    alignContent: 'start',
    gap: 6,
    padding: 8,
    textAlign: 'left',
    fontSize: 12,
    '@media': {[phone]: {width: 136}},
  },
  {
    selectors: {
      '[data-animate-input="keyboard"] &': {
        transition: 'none',
        animation: 'none',
      },
    },
  },
]);
export const ghostHead = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  whiteSpace: 'nowrap',
});
export const ghostHint = style({fontSize: 11, lineHeight: 1.35, opacity: 0.7});
export const addTab = style([
  add,
  {width: 104, alignSelf: 'flex-end', marginBottom: 8, fontSize: 12, gap: 2},
  {
    selectors: {
      '[data-animate-input="keyboard"] &': {
        transition: 'none',
        animation: 'none',
      },
    },
  },
]);

export const glyph = style({width: 18, height: 16});
