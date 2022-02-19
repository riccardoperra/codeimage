import {createTheme} from '@vanilla-extract/css';
import {colors} from './theme.css';
import {themeVars} from './global.css';

export const darkThemeCss = createTheme(colors, {
  primary: themeVars.backgroundColor.blue['400'],
  panelBackground: '#111111',
  background: '#181818',
  baseText: themeVars.textColor.gray['800'],
  secondary: themeVars.backgroundColor.gray['200'],
  divider: '#252525',
});
