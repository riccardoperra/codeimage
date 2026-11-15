import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
export const content = style({
  width: 340,
  maxWidth: 'calc(100vw - 32px)',
  rowGap: 12,
  padding: 16,
});
globalStyle(`${content} > p`, {display: 'grid', gap: 12});
globalStyle(`${content} [data-cui="segmentedControl"]`, {height: 28});
export const curve = style({
  width: '100%',
  height: 144,
  color: c.baseText,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
});
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
