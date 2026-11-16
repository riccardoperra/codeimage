import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
export const content = style({
  width: 340,
  maxWidth: 'calc(100vw - 32px)',
  rowGap: 12,
  padding: 16,
  selectors: {
    '&[data-transition-popover]': {width: 300, padding: 12, fontSize: 13},
  },
});
globalStyle(`${content} > p`, {display: 'grid', gap: 12});
globalStyle(`${content} [data-cui="segmentedControl"]`, {
  height: 28,
  '@media': {'(max-width: 768px)': {height: 40}},
});
globalStyle(
  `${content} [role="tab"], ${content} [data-cui="button"], ${content} input`,
  {
    '@media': {'(max-width: 768px)': {minHeight: 40, minWidth: 40}},
  },
);
export const curve = style([
  {
    width: '100%',
    height: 144,
    color: c.baseText,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  },
  {selectors: {'[data-transition-popover] &': {height: 88}}},
]);
export const glyph = style({
  width: 22,
  height: 20,
  flexShrink: 0,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 5,
});
export const guide = style({opacity: 0.3, strokeWidth: 1});
export const point = style({fill: c.dialog.panelBackgroundColor});
export const dot = style({fill: c.primary, stroke: c.primary});

export const body = style({
  display: 'grid',
  gap: 12,
  selectors: {'[data-transition-popover] &': {gap: 10}},
});
export const preset = style({
  selectors: {'[data-transition-popover] &': {fontSize: 12}},
});
export const play = style({
  selectors: {
    '[data-transition-popover] &': {
      minHeight: 28,
      height: 28,
      fontSize: 13,
      '@media': {'(max-width: 768px)': {minHeight: 40, height: 40}},
    },
  },
});
