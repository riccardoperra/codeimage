import {themeVars} from './global.css';
import {createVar, style} from '@vanilla-extract/css';

export const scrollbar = style({
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

export const dynamicFullHeight = createVar();

export const adaptiveFullScreenHeight = style({
  height: '100vh',
  vars: {
    [dynamicFullHeight]: '1vh',
  },
  '@media': {
    'screen and (max-width: 768px)': {
      height: `calc(${dynamicFullHeight} * 100)`,

      '@supports': {
        // ios 15+
        '(height: 100svh)': {
          height: '100svh',
        },
      },

      overflow: 'hidden',
    },
  },
});
