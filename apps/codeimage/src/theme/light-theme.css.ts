import {createTheme} from '@vanilla-extract/css';
import {colors} from './theme.css';
import {themeVars} from './global.css';

export const lightThemeCss = createTheme(colors, {
  primary: themeVars.backgroundColor.blue['500'],
  background: themeVars.backgroundColor.gray['100'],
  baseText: themeVars.textColor.gray['700'],
  descriptionTextColor: themeVars.backgroundColor.gray['700'],
  secondary: themeVars.backgroundColor.gray['200'],
  divider: themeVars.backgroundColor.gray['300'],

  panel: {
    background: themeVars.backgroundColor.white,
    textColor: themeVars.backgroundColor.black,
  },

  input: {
    backgroundColor: '#f3f3f3',
    borderColor: 'transparent',
    textColor: '#333333ó',
    labelTextColor: themeVars.backgroundColor.gray['800'],
    labelTextHintColor: themeVars.backgroundColor.gray['700'],
    accentColor: themeVars.backgroundColor.white,
  },

  button: {
    base: {
      backgroundColor: themeVars.backgroundColor.gray['300'],
      activeColor: themeVars.backgroundColor.gray['500'],
      hoverColor: themeVars.backgroundColor.gray['400'],
      textColor: themeVars.backgroundColor.gray['800'],
    },
    primary: {
      backgroundColor: themeVars.backgroundColor.blue['500'],
      activeColor: themeVars.backgroundColor.blue['700'],
      hoverColor: themeVars.backgroundColor.blue['600'],
      textColor: themeVars.backgroundColor.white,
    },
  },

  listBox: {
    panelBackground: themeVars.backgroundColor.white,
    activeBackgroundColor: themeVars.backgroundColor.blue['500'],
    hoverBackgroundColor: themeVars.backgroundColor.gray['100'],
    textColor: themeVars.backgroundColor.gray['800'],
    activeTextColor: themeVars.backgroundColor.white,
  },

  menuBackground: themeVars.backgroundColor.white,
  resizeLineBackgroundColor: themeVars.backgroundColor.gray['600'],
  resizeLineBadgeBackgroundColor: themeVars.backgroundColor.gray['700'],
  scrollBarBackgroundColor: themeVars.backgroundColor.gray['400'],
  scrollBarHoverBackgroundColor: themeVars.backgroundColor.gray['500'],
  bottomBarBackgroundColor: themeVars.backgroundColor.white,
  bottomBarTextColor: themeVars.textColor.gray['700'],
  emptySquareBackgroundColor: themeVars.backgroundColor.gray['300'],
  snackbarBackgroundColor: '#1a1a1a',
  snackbarTextColor: themeVars.backgroundColor.white,
  frameDragControlBackgroundColor: themeVars.backgroundColor.gray['800'],
  dialogOverlayBackgroundColor: 'rgba(0,0,0,.4)',
  dialogTitleTextColor: themeVars.backgroundColor.gray['800'],
  dialogTitleBorderColor: themeVars.borderColor.default,
  dialogPanelShadow: themeVars.boxShadow.lg,
  dialogPanelBackgroundColor: themeVars.backgroundColor.white,
  dialogPanelTextColor: themeVars.backgroundColor.gray['800'],
  shortcutKeyBackgroundColor: '#f3f3f3',
});
