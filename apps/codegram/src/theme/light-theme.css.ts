import {createTheme} from '@vanilla-extract/css';
import {colors} from './theme.css';
import {themeVars} from './global.css';

export const lightThemeCss = createTheme(colors, {
  primary: themeVars.backgroundColor.blue['500'],
  background: themeVars.backgroundColor.white,
  panelBackground: themeVars.backgroundColor.gray['100'],
  baseText: themeVars.textColor.gray['800'],
  secondary: themeVars.backgroundColor.gray['200'],
  divider: themeVars.backgroundColor.gray['300'],
});
