import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';

export const boxBase = style({
  '::-webkit-scrollbar': {
    width: '18px',
  },

  '::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '::-webkit-scrollbar-thumb': {
    backgroundColor: themeVars.dynamicColors.scrollBar.backgroundColor,
    borderRadius: themeVars.borderRadius.full,
    border: '6px solid transparent',
    backgroundClip: 'content-box',
    transition: 'background-color .2s',
  },

  selectors: {
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: themeVars.dynamicColors.scrollBar.hoverBackgroundColor,
    },
  },
});
