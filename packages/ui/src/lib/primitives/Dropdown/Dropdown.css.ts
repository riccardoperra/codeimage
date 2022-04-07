import {style} from '@vanilla-extract/css';
import * as buttonStyles from '../Button/Button.css';
import {themeVars} from '../../theme';

export const dropdownPanel = style({
  overflow: 'hidden',
  borderRadius: themeVars.borderRadius.lg,
  backgroundColor: themeVars.dynamicColors.listBox.panelBackground,
  display: 'flex',
  flexDirection: 'column',
  width: '260px',
  boxShadow: themeVars.boxShadow.md,
});

export const dropdownMenuPanel = style({
  boxShadow: themeVars.boxShadow.md,
  backgroundColor: themeVars.dynamicColors.listBox.panelBackground,
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
  buttonStyles.button,
  {
    textAlign: 'left',
    border: 0,
    margin: 0,
    display: 'block',
    width: '100%',
    padding: `${themeVars.spacing['2']}`,
    borderRadius: themeVars.borderRadius.md,
    background: 'transparent',
    color: themeVars.dynamicColors.listBox.textColor,

    ':focus': {
      boxShadow: 'none',
      outline: 'none',
    },

    ':hover': {
      backgroundColor: themeVars.dynamicColors.listBox.hoverBackgroundColor,
    },

    selectors: {
      '&[aria-selected=true]': {
        backgroundColor: themeVars.dynamicColors.listBox.activeBackgroundColor,
        color: themeVars.dynamicColors.listBox.activeTextColor,
      },
      '&[aria-selected=true]:hover': {
        backgroundColor: themeVars.dynamicColors.listBox.activeBackgroundColor,
      },
    },
  },
]);
