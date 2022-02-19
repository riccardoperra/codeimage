import {createTheme} from '@vanilla-extract/css';
import {colors} from './theme.css';
import {themeVars} from './global.css';

export const darkThemeCss = createTheme(colors, {
  primary: themeVars.backgroundColor.blue['400'],
  panelBackground: '#111111',
  panelTextColor: themeVars.backgroundColor.white,
  background: '#181818',
  baseText: themeVars.textColor.gray['800'],
  secondary: themeVars.backgroundColor.gray['200'],
  divider: '#252525',
  inputBackgroundColor: '#2B2B2B',
  inputBorderColor: '#252525',
  inputTextColor: '#EEEEEE',
  inputAccentColor: '#555555',
  buttonBackgroundColor: '#333333',
  buttonBackgroundActive: '#232323',
  buttonBackgroundHover: '#282828',
  buttonTextColor: themeVars.backgroundColor.white,
  buttonBackgroundPrimaryColor: themeVars.backgroundColor.blue['500'],
  buttonBackgroundPrimaryActive: themeVars.backgroundColor.blue['700'],
  buttonBackgroundPrimaryHover: themeVars.backgroundColor.blue['600'],
  buttonTextPrimaryColor: themeVars.backgroundColor.white,
});
