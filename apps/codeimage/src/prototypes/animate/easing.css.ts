import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;

export const trigger = style({
  gap: '8px',
  minWidth: '132px',
  justifyContent: 'flex-start',
});

export const popover = style({
  width: '304px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const graph = style({
  position: 'relative',
  display: 'block',
  width: '100%',
  height: '150px',
  borderRadius: '12px',
  background: c.input.backgroundColor,
  overflow: 'visible',
});

globalStyle(`${graph} .grid`, {
  stroke: c.divider,
  strokeWidth: 1,
  fill: 'none',
});
globalStyle(`${graph} .reference`, {
  stroke: c.divider,
  strokeDasharray: '3 4',
  strokeWidth: 1,
  fill: 'none',
});
globalStyle(`${graph} .curve`, {
  stroke: c.primary,
  strokeWidth: 2.5,
  strokeLinecap: 'round',
  fill: 'none',
});
globalStyle(`${graph} .arm`, {
  stroke: c.descriptionTextColor,
  strokeWidth: 1,
  opacity: 0.6,
});
globalStyle(`${graph} .point`, {
  fill: c.panel.background,
  stroke: c.descriptionTextColor,
  strokeWidth: 1.5,
});
globalStyle(`${graph} .dot`, {
  fill: c.primary,
  stroke: c.panel.background,
  strokeWidth: 2,
});
globalStyle(`${graph} .guide`, {
  stroke: c.primary,
  strokeWidth: 1,
  opacity: 0.35,
});

export const graphFooter = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  minHeight: '28px',
  fontSize: '12px',
  color: c.descriptionTextColor,
});

export const chipTrack = style({
  position: 'relative',
  height: '36px',
  borderRadius: '10px',
  background: c.input.backgroundColor,
  overflow: 'hidden',
});

export const chip = style({
  position: 'absolute',
  top: '7px',
  left: '8px',
  padding: '3px 8px',
  borderRadius: '6px',
  font: '500 12px/16px "Jetbrains Mono", ui-monospace, monospace',
  color: c.button.primary.textColor,
  background: c.primary,
  willChange: 'transform',
});

export const customRow = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const hint = style({
  fontSize: '12px',
  color: c.descriptionTextColor,
  selectors: {
    '&[data-error]': {color: c.button.danger.backgroundColor},
  },
});

export const code = style({
  fontFamily: '"Jetbrains Mono", ui-monospace, monospace',
  fontSize: '11px',
});
