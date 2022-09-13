import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const wrapper = style([
  {
    width: '100vw',
    position: 'relative',
    display: 'flex',
    height: '100%',
    minHeight: 0,

    '@media': {
      'screen and (max-width: 768px)': {
        flexDirection: 'column',
      },
    },
  },
]);

export const mobileActionToolbar = style({
  backdropFilter: 'blur(20px) saturate(180%)',
  ['webkitBackdropFilter' as string]: 'blur(20px) saturate(180%)',
  position: 'absolute',
  paddingTop: themeVars.spacing['2'],
  paddingBottom: themeVars.spacing['2'],
  paddingLeft: themeVars.spacing['4'],
  paddingRight: themeVars.spacing['4'],
  width: '100%',
  zIndex: 5,
});
