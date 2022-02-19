import {createTheme} from '@vanilla-extract/css';
import {colors} from './theme.css';
import {themeVars} from './global.css';

export const lightThemeCss = createTheme(colors, {
  primary: themeVars.backgroundColor.blue['500'],
  panelBackground: themeVars.backgroundColor.white,
  panelTextColor: themeVars.backgroundColor.black,
  background: themeVars.backgroundColor.gray['100'],
  baseText: themeVars.textColor.gray['800'],
  secondary: themeVars.backgroundColor.gray['200'],
  divider: themeVars.backgroundColor.gray['300'],
  inputBackgroundColor: themeVars.backgroundColor.white,
  inputBorderColor: themeVars.backgroundColor.gray['300'],
  inputTextColor: themeVars.backgroundColor.gray['800'],
  inputAccentColor: themeVars.backgroundColor.gray['200'],
});
