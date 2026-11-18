import {style} from '@vanilla-extract/css';
import {windowVars as palette} from '../../windowPalette.css';

export const wrapper = style({
  display: 'flex',
  alignItems: 'center',
  minWidth: 0,
  flex: '1 1 auto',
  selectors: {
    '&[data-window-tabs=editor]': {height: '40px'},
    '&[data-window-tabs=shell]': {justifyContent: 'center', margin: '0 76px'},
  },
});
export const list = style({
  display: 'flex',
  alignItems: 'stretch',
  minWidth: 0,
  overflow: 'hidden',
});
export const tab = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: 0,
  color: palette.ink45,
  fontSize: '12.5px',
  fontFamily: 'inherit',
  flex: '0 1 auto',
  selectors: {
    '&[data-window-tab=card]': {height: '44px', paddingRight: '12px'},
    '&[data-window-tab=card][data-active=true]': {color: palette.ink78},
    '&[data-window-tab=editor]': {
      height: '40px',
      padding: '0 16px',
      boxShadow: `inset -1px 0 0 ${palette.ink08}`,
    },
    '&[data-window-tab=editor][data-active=true]': {
      color: palette.ink90,
      background: palette.background,
      boxShadow: `inset 0 2px 0 ${palette.accent}, inset -1px 0 0 ${palette.ink08}`,
    },
    '&[data-window-tab=shell]': {height: '38px', padding: '0 8px'},
    '&[data-window-tab=shell][data-active=true]': {color: palette.ink62},
  },
});
export const text = style({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const mark = style({
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  flexShrink: 0,
  background: palette.ink20,
  selectors: {
    [`${tab}[data-active=true] &`]: {background: palette.accent},
    [`${tab}[data-window-tab=card] &`]: {
      width: '8px',
      height: '8px',
      borderRadius: '2px',
    },
  },
});
export const add = style({
  border: 0,
  background: 'transparent',
  color: palette.ink45,
  fontSize: '18px',
  width: '24px',
  height: '24px',
  flexShrink: 0,
  margin: '0 4px',
  padding: 0,
  cursor: 'pointer',
});
export const close = style({
  border: 0,
  background: 'transparent',
  color: palette.ink45,
  fontSize: '14px',
  width: '14px',
  height: '18px',
  flexShrink: 0,
  padding: 0,
  cursor: 'pointer',
});

export const sortableInteraction = style({
  touchAction: 'pan-y',
  selectors: {
    '&:focus-visible': {
      outline: '1px solid currentColor',
      outlineOffset: '-2px',
    },
    '&[data-window-tab][data-active-drag=true]': {
      zIndex: 21,
    },
  },
});
