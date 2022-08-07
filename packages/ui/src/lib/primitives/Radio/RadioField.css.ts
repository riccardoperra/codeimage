import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';

export const radioWrapper = style({
  display: 'flex',
  alignItems: 'flexStart',
});

export const [radioTheme, radioVars] = createTheme({
  size: '',
  activeBackgroundColor: themeVars.dynamicColors.primary,
});

export const radioGroup = style([
  radioTheme,
  {
    gap: themeVars.spacing['3'],
  },
]);

export const radio = style({
  position: 'relative',
  overflow: 'hidden',
  width: '16px',
  height: '16px',
  flexShrink: '0',
  margin: '2px 2px',
  backgroundColor: themeVars.dynamicColors.input.accentColor,
  borderRadius: themeVars.borderRadius.full,
  outline: 'none',
  transition: 'all .2s',

  ':before': {
    position: 'absolute',
    zIndex: '2',
    top: '5px',
    left: '5px',
    width: '6px',
    height: '6px',
    background: 'white',
    borderRadius: '50%',
    content: '""',
    transform: 'scale(0)',
    transformOrigin: 'center',
    transition: 'transform .2s cubic-bezier(.68,0,.26,1.6) 0s',
    willChange: 'transform',
  },

  ':after': {
    position: 'absolute',
    zIndex: themeVars.zIndex['0'],
    content: '""',
    top: '0px',
    left: '0px',
    width: '100%',
    height: '100%',
    background: radioVars.activeBackgroundColor,
    borderRadius: '50%',
    transform: 'scale(0)',
    transition: 'transform .2s ease',
  },

  selectors: {
    '&:checked:after': {
      transform: 'scale(1)',
    },
    '&:checked:before': {
      transform: 'scale(1)',
      transition: 'transform .2s cubic-bezier(.68,0,.26,1.6) .1s',
    },
  },
});
