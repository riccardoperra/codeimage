import {adaptiveFullScreenHeight, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const wrapper = style([
  adaptiveFullScreenHeight,
  {
    width: '100vw',
    position: 'relative',
    display: 'flex',

    '@media': {
      'screen and (max-width: 768px)': {
        flexDirection: 'column',
      },
    },
  },
]);

export const canvasToolbar = style({
  height: '46px',
  backgroundColor: themeVars.dynamicColors.input.backgroundColor,
  width: '100%',
  borderRadius: themeVars.borderRadius.lg,
  boxShadow: themeVars.boxShadow.md,
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '1rem',
  paddingRight: '1rem',
});
