import {adaptiveFullScreenHeight, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const scaffold = style([
  adaptiveFullScreenHeight,
  {
    color: themeVars.dynamicColors.panel.textColor,
    background: themeVars.dynamicColors.panel.background,
    display: 'flex',
    flexDirection: 'column',
  },
]);

export const wrapper = style([
  adaptiveFullScreenHeight,
  {
    position: 'relative',
    height: '100%',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    color: themeVars.dynamicColors.panel.textColor,
    display: 'flex',
    flexDirection: 'column',
  },
]);

export const main = style({
  marginTop: themeVars.spacing['12'],
  marginBottom: themeVars.spacing['12'],
  flex: 1,
  display: 'flex',
  width: '100%',
  height: '100%',
  minHeight: '0',
  paddingLeft: themeVars.spacing['3'],
  paddingRight: themeVars.spacing['3'],
  marginLeft: 'auto',
  marginRight: 'auto',
  flexDirection: 'column',
  '@media': {
    [`(min-width: 1280px)`]: {
      width: '1280px',
    },
  },
});

export const scrollableList = style([
  {
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
  },
  {
    flex: 1,
    overflow: 'auto',
    minHeight: '0',
    height: '100%',
  },
]);
