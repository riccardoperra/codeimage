import {style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';

export const overlay = style({
  position: 'absolute',
  width: '100%',
  height: '100%',
  backgroundColor: `rgba(0, 0, 0, .25)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const loader = style({
  selectors: {
    ['[data-theme-mode=dark] &']: {
      stroke: themeVars.backgroundColor.white,
    },
    ['[data-theme-mode=light] &']: {
      stroke: themeVars.backgroundColor.black,
    },
  },
});
