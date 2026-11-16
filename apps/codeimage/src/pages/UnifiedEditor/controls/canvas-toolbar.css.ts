import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

const c = themeVars.dynamicColors;
const phone = 'screen and (max-width: 768px)';

export const anchor = style({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  maxWidth: '100%',
  minWidth: 0,
});

export const toolbar = style({
  position: 'relative',
  isolation: 'isolate',
  display: 'flex',
  boxSizing: 'border-box',
  maxWidth: '100%',
  padding: '6px',
  borderRadius: '18px',
  color: c.panel.textColor,
  pointerEvents: 'auto',
  selectors: {'&[data-covered]': {visibility: 'hidden'}},
  '@media': {
    [phone]: {flexWrap: 'wrap', justifyContent: 'center', gap: '4px'},
  },
});

export const surface = style({
  position: 'absolute',
  inset: 0,
  zIndex: -1,
  borderRadius: 'inherit',
  background: c.panel.background,
});

export const pivot = style({display: 'flex', flexShrink: 0});

export const content = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  minWidth: 0,
  '@media': {[phone]: {display: 'contents'}},
  selectors: {
    '&[data-side="left"]:not(:empty)': {paddingRight: '4px'},
    '&[data-side="right"]:not(:empty)': {paddingLeft: '4px'},
    '&:not([data-active])': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 'max-content',
      flexWrap: 'nowrap',
      opacity: 0,
      visibility: 'hidden',
      pointerEvents: 'none',
    },
  },
});

export const button = style({
  selectors: {
    '[data-bar-mode] &': {
      minHeight: '36px',
      '@media': {[phone]: {minHeight: '40px'}},
    },
  },
});
