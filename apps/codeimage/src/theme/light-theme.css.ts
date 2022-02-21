import {createTheme} from '@vanilla-extract/css';
import {colors} from './theme.css';
import {themeVars} from './global.css';

export const lightThemeCss = createTheme(colors, {
  primary: themeVars.backgroundColor.blue['500'],
  panelBackground: themeVars.backgroundColor.white,
  panelTextColor: themeVars.backgroundColor.black,
  background: themeVars.backgroundColor.gray['100'],
  baseText: themeVars.textColor.gray['800'],
  descriptionTextColor: themeVars.backgroundColor.gray['600'],
  secondary: themeVars.backgroundColor.gray['200'],
  divider: themeVars.backgroundColor.gray['300'],
  inputBackgroundColor: themeVars.backgroundColor.white,
  inputBorderColor: themeVars.backgroundColor.gray['300'],
  inputTextColor: themeVars.backgroundColor.gray['800'],
  inputAccentColor: themeVars.backgroundColor.gray['200'],
  buttonBackgroundColor: themeVars.backgroundColor.gray['300'],
  buttonBackgroundActive: themeVars.backgroundColor.gray['500'],
  buttonBackgroundHover: themeVars.backgroundColor.gray['400'],
  buttonTextColor: themeVars.backgroundColor.gray['800'],
  buttonBackgroundPrimaryColor: themeVars.backgroundColor.blue['500'],
  buttonBackgroundPrimaryActive: themeVars.backgroundColor.blue['700'],
  buttonBackgroundPrimaryHover: themeVars.backgroundColor.blue['600'],
  buttonTextPrimaryColor: themeVars.backgroundColor.white,
  menuBackground: themeVars.backgroundColor.white,
  resizeLineBackgroundColor: themeVars.backgroundColor.gray['600'],
  resizeLineBadgeBackgroundColor: themeVars.backgroundColor.gray['700'],
});
