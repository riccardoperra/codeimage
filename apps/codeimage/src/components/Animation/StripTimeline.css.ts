import {themeVars} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';
const c = themeVars.dynamicColors;
export const fraction = createVar();
export const gaps = createVar();
export const position = createVar();
export const ruler = style({
  height: 24,
  position: 'relative',
  cursor: 'ew-resize',
  touchAction: 'none',
  outlineOffset: 2,
});
export const tick = style({
  position: 'absolute',
  left: position,
  fontSize: 10,
  opacity: 0.65,
  fontVariantNumeric: 'tabular-nums',
  transform: 'translateX(-50%)',
});
export const playhead = style({
  position: 'absolute',
  left: position,
  top: 0,
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
  display: 'flex',
  gap: 3,
  height: 36,
  overflow: 'hidden',
  '@media': {'(max-width: 768px)': {height: 40}},
});
export const segment = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minWidth: 8,
  width: `calc(${fraction} * (100% - ${gaps}))`,
  flexShrink: 0,
  padding: '0 8px',
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
export const label = style({overflow: 'hidden', textOverflow: 'ellipsis'});
export const handle = style({
  position: 'absolute',
  right: 0,
  top: 0,
  bottom: 0,
  width: 8,
  cursor: 'ew-resize',
  touchAction: 'none',
});
