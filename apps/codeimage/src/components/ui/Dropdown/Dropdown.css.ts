import {style} from '@vanilla-extract/css';
import {themeVars} from '../../../theme/global.css';
import {button} from '../Button/Button.css';

export const dropdownPanel = style({
  overflow: 'hidden',
  borderRadius: themeVars.borderRadius.lg,
  backgroundColor: themeVars.dynamicColors.menuBackground,
  display: 'flex',
  flexDirection: 'column',
  width: '260px',
  boxShadow: themeVars.boxShadow.md,
});

export const dropdownMenuPanel = style({
  boxShadow: themeVars.boxShadow.md,
  backgroundColor: themeVars.dynamicColors.menuBackground,
  display: 'flex',
  flexDirection: 'row',
  overflow: 'hidden',
  borderRadius: themeVars.borderRadius.md,
  zIndex: themeVars.zIndex['40'],
});

export const dropdownMenu = style({
  padding: themeVars.spacing['2'],
  display: 'flex',
  flexDirection: 'column',
  rowGap: themeVars.spacing['1'],
});

export const dropdownMenuButton = style([
  button,
  {
    textAlign: 'left',
    border: 0,
    margin: 0,
    display: 'block',
    width: '100%',
    height: '32px',
    padding: `${themeVars.spacing['0']} ${themeVars.spacing['2']}`,
    borderRadius: themeVars.borderRadius.md,
    lineHeight: '32px',
    color: themeVars.dynamicColors.buttonTextColor,

    ':focus': {
      boxShadow: 'none',
      outline: 'none',
    },

    ':hover': {
      backgroundColor: themeVars.dynamicColors.buttonBackgroundPrimaryColor,
    },

    selectors: {
      '&[aria-selected=true]': {
        backgroundColor: themeVars.dynamicColors.buttonBackgroundPrimaryColor,
      },
    },
  },
]);
