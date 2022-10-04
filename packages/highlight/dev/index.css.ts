import {adaptiveFullScreenHeight, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const container = style([
  adaptiveFullScreenHeight,
  {
    color: themeVars.dynamicColors.panel.textColor,
    display: 'flex',
    backdropFilter: 'brightness(0.8)',
    flexDirection: 'column',
    width: '100%',
    paddingLeft: themeVars.spacing['3'],
    paddingRight: themeVars.spacing['3'],
    paddingTop: themeVars.spacing['12'],
    paddingBottom: themeVars.spacing['12'],
    marginLeft: 'auto',
    marginRight: 'auto',
    '@media': {
      [`(min-width: 1280px)`]: {
        width: '1280px',
      },

      'screen and (max-width: 768px)': {
        paddingTop: themeVars.spacing['4'],
      },
    },
  },
]);

export const editorContainer = style({
  display: 'flex',
  width: '100%',
  height: '100%',
  minHeight: '0',
  marginLeft: 'auto',
  marginRight: 'auto',
  flexDirection: 'column',
  marginTop: themeVars.spacing['2'],
});
