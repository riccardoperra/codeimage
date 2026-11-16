import {themeVars} from '@codeimage/ui';
import {createVar, globalStyle, style} from '@vanilla-extract/css';
import {TIMELINE_GAP} from './timelineGeometry';
const c = themeVars.dynamicColors;
export const root = style({minWidth: 0, overflow: 'clip', padding: '2px 4px'});
export const axis = style({width: '100%'});
export const segmentWidth = createVar();
export const position = createVar();
export const ruler = style({
  height: 24,
  position: 'relative',
  cursor: 'ew-resize',
  touchAction: 'none',
  outlineOffset: 2,
});
export const playhead = style({
  position: 'absolute',
  left: position,
  top: 12,
  bottom: 0,
  width: 2,
  background: c.primary,
  pointerEvents: 'none',
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: c.primary,
      left: -3,
      top: 0,
    },
  },
});
export const track = style({
  minWidth: 0,
  display: 'flex',
  gap: TIMELINE_GAP,
  height: 36,
  overflow: 'hidden',
});
export const segment = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minWidth: 0,
  width: segmentWidth,
  flexShrink: 0,
  padding: 0,
  border: 0,
  borderRadius: themeVars.borderRadius.md,
  background: c.panel.background,
  color: c.baseText,
  font: 'inherit',
  fontSize: 11,
  cursor: 'pointer',
  boxSizing: 'border-box',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  selectors: {
    '&[data-kind="transition"]': {background: c.background},
    '&[data-selected]': {boxShadow: `inset 0 0 0 2px ${c.primary}`},
    '&[data-current]::after': {
      content: '""',
      position: 'absolute',
      left: 5,
      right: 5,
      bottom: 3,
      height: 2,
      background: c.baseText,
    },
    '&:focus-visible': {outline: `2px solid ${c.primary}`, outlineOffset: -2},
  },
});
globalStyle(`${root}[data-overview]`, {position: 'relative', height: 40});
globalStyle(`${root}[data-overview] ${ruler}`, {
  position: 'absolute',
  inset: '0 4px',
  height: 40,
  zIndex: 1,
});
globalStyle(`${root}[data-overview] ${track}`, {height: 12, marginTop: 14});
globalStyle(`${root}[data-overview] ${playhead}`, {top: 8, bottom: 8});
globalStyle(`${root}[data-overview] ${ruler}[data-over-window]`, {
  cursor: 'grab',
});
globalStyle(`${root}[data-overview] ${ruler}:active[data-over-window]`, {
  cursor: 'grabbing',
});
globalStyle(`${root}[data-overview] ${segment}::before`, {
  content: '""',
  position: 'absolute',
  inset: 0,
  background: c.primary,
  opacity: 0,
  transition: 'opacity 120ms ease',
});
globalStyle(`${root}[data-overview] ${segment}[data-linked]::before`, {
  opacity: 0.55,
});

export const viewWindow = style({
  position: 'absolute',
  left: 0,
  top: 6,
  bottom: 6,
  boxSizing: 'border-box',
  borderRadius: themeVars.borderRadius.md,
  boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${c.primary} 70%, transparent)`,
  background: `color-mix(in srgb, ${c.primary} 10%, transparent)`,
  pointerEvents: 'none',
});
