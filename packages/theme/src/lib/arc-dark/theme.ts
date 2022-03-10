import {buildCustomTheme} from '../core';
import {arcDark, palette} from './arcDark';

export const arcDarkTheme = buildCustomTheme({
  id: 'arkDark',
  editorTheme: arcDark,
  properties: {
    darkMode: true,
    label: 'Arc Dark',
    previewBackground: palette.gray,
    terminal: {
      main: palette.background,
      text: palette.grayLight,
    },
  },
});
