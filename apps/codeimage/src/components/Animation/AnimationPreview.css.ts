import {themeVars} from '@codeimage/ui';
import {globalStyle, keyframes, style} from '@vanilla-extract/css';
import {curve} from '../WhatsNew/motion';
import {checkerboard} from '../Frame/FrameHandler.css';

export const layers = style({
  position: 'relative',
  display: 'grid',
  placeItems: 'center',
});

export const layer = style({
  gridArea: '1 / 1',
  display: 'grid',
  placeItems: 'center',
});

export const stage = style({
  gridArea: '1 / 1',
  position: 'relative',
  borderRadius: themeVars.borderRadius.lg,
  outline: 'none',
  selectors: {
    '&:focus-visible': {
      boxShadow: `0 0 0 2px ${themeVars.dynamicColors.primary}`,
    },
  },
});
globalStyle(`${stage} [data-animation-frame]`, checkerboard);

export const pill = style({
  position: 'absolute',
  top: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2,
  border: 0,
  borderRadius: themeVars.borderRadius.xl,
  padding: '10px 16px',
  background: themeVars.backgroundColor.gray['800'],
  color: themeVars.backgroundColor.white,
  fontFamily: 'inherit',
  fontSize: 13,
  width: 'max-content',
  maxWidth: 'calc(100% - 24px)',
  whiteSpace: 'normal',
  textAlign: 'center',
  cursor: 'pointer',
});

const modeIn = keyframes({
  from: {opacity: 0, transform: 'translateY(-4px)'},
  to: {opacity: 1, transform: 'translateY(0)'},
});
const modeFade = keyframes({from: {opacity: 0}, to: {opacity: 1}});

export const mode = style({
  position: 'absolute',
  top: 12,
  left: 12,
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 4px 4px 12px',
  borderRadius: 999,
  background: themeVars.dynamicColors.panel.background,
  color: themeVars.dynamicColors.panel.textColor,
  boxShadow: themeVars.boxShadow.md,
  fontSize: 13,
  fontWeight: 500,
  animation: `${modeIn} 200ms ${curve.out} 80ms backwards`,
  selectors: {'[data-animate-input="keyboard"] &': {animation: 'none'}},
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      animation: `${modeFade} 150ms linear`,
    },
  },
});
export const modeDot = style({
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: themeVars.dynamicColors.primary,
});
export const modeLabel = style({whiteSpace: 'nowrap'});
export const modeDone = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 28,
  padding: '0 6px 0 12px',
  border: 0,
  borderRadius: 999,
  background: themeVars.dynamicColors.background,
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  transition: `transform 160ms ${curve.out}`,
  selectors: {
    '&:active': {transform: 'scale(0.97)'},
    '&:focus-visible': {
      outline: `2px solid ${themeVars.dynamicColors.primary}`,
      outlineOffset: 1,
    },
  },
  '@media': {'(max-width: 768px)': {height: 40}},
});
export const modeKey = style({
  padding: '1px 6px',
  borderRadius: 6,
  background: themeVars.dynamicColors.panel.background,
  fontFamily: 'inherit',
  fontSize: 11,
  opacity: 0.7,
});

export const scene = style({display: 'none'});
