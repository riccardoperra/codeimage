import {themeVars} from './global.css';
import {style} from '@vanilla-extract/css';

export const scrollbar = style({
  '::-webkit-scrollbar': {
    width: '18px',
  },

  '::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '::-webkit-scrollbar-thumb': {
    backgroundColor: themeVars.dynamicColors.scrollBarBackgroundColor,
    borderRadius: themeVars.borderRadius.full,
    border: '6px solid transparent',
    backgroundClip: 'content-box',
    transition: 'background-color .2s',
  },

  selectors: {
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: themeVars.dynamicColors.scrollBarHoverBackgroundColor,
    },
  },
});
