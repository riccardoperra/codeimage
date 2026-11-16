import {themeVars} from '@codeimage/ui';
import {globalStyle, style} from '@vanilla-extract/css';
import {curve, reduceMotion} from '../../WhatsNew/motion';

const c = themeVars.dynamicColors;

export const ring = style({
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: 2,
  boxSizing: 'border-box',
  border: `2px solid ${c.primary}`,
  borderRadius: themeVars.borderRadius.lg,
  pointerEvents: 'none',
  opacity: 0,
  selectors: {
    '&[data-glide]': {
      transition: `transform 180ms ${curve.out}, width 180ms ${curve.out}, height 180ms ${curve.out}`,
    },
  },
  '@media': {[reduceMotion]: {transition: 'none'}},
});

export const progress = style({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 3,
  background: c.primary,
  transformOrigin: 'left',
  pointerEvents: 'none',
});

export const scrubber = style({marginBottom: -4});
export const linked = style({
  selectors: {
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      boxShadow: `inset 0 0 0 1px ${c.primary}`,
      background: `color-mix(in srgb, ${c.primary} 8%, transparent)`,
      opacity: 0,
      pointerEvents: 'none',
      transition: 'opacity 120ms ease',
    },
    '&[data-linked]::before': {opacity: 1},
  },
});

globalStyle(`[data-animate-input="keyboard"] ${ring}`, {
  transition: 'none',
  animation: 'none',
});
