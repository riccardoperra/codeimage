import {createTheme} from '../../core';
import {coldarkDark, palette} from './coldark-dark';

export const coldarkDarkTheme = createTheme({
  id: 'coldarkDark',
  editorTheme: coldarkDark,
  properties: {
    darkMode: true,
    label: 'Coldark Dark',
    previewBackground:
      'linear-gradient(to left top, #162b46, #192c45, #1c2e45, #1e2f44, #213043)',
    terminal: {
      main: '#111b27',
      text: palette.white,
    },
  },
} as const);
