import {createTheme} from '../../core';
import {duotoneDark, palette} from './duotoneDark';

export const duotoneDarkTheme = createTheme({
  id: 'duotoneDark',
  editorTheme: duotoneDark,
  properties: {
    darkMode: true,
    label: 'Duotone Dark',
    previewBackground: palette.salmon,
    terminal: {
      main: '#2D2B38',
      text: palette.white,
    },
  },
} as const);
