import {themeVars} from '../../theme';
import {style} from '@vanilla-extract/css';

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
