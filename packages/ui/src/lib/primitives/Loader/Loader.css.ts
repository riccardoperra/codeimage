import {themeVars} from '../../theme';
import {style} from '@vanilla-extract/css';

export const loader = style({
  selectors: {
    ['[data-cui-theme=dark] &']: {
      stroke: themeVars.backgroundColor.white,
    },
    ['[data-cui-theme=light] &']: {
      stroke: themeVars.backgroundColor.black,
    },
  },
});
