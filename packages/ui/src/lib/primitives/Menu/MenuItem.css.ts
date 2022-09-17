import {style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';
import * as buttonStyles from '../Button/Button.css';
import {ButtonSizes} from '../Button/Button.css';

export const menuItem = style([
  buttonStyles.button,
  buttonStyles.buttonVariant({size: ButtonSizes.md}),
  {
    textAlign: 'left',
    justifyContent: 'flex-start',
    border: 0,
    margin: 0,
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
