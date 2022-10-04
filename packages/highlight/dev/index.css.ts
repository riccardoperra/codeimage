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
    height: '100%',
    paddingLeft: themeVars.spacing['3'],
    paddingRight: themeVars.spacing['3'],
    marginTop: themeVars.spacing['12'],
    marginBottom: themeVars.spacing['12'],
    marginLeft: 'auto',
    marginRight: 'auto',
    '@media': {
      [`(min-width: 1280px)`]: {
        width: '1280px',
      },

      'screen and (max-width: 768px)': {
        marginTop: themeVars.spacing['4'],
      },
    },
  },
]);
