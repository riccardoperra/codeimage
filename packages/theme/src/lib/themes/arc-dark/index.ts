import {createTheme} from '../../core';
import {arcDark, palette} from './arcDark';

export const arcDarkTheme = createTheme({
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
} as const);
