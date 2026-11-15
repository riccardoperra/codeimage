import {createTheme} from '../../core';
import {oneDark} from '@codemirror/theme-one-dark';

export const oneDarkTheme = createTheme({
  id: 'oneDark',
  editorTheme: oneDark,
  properties: {
    darkMode: true,
    label: 'One dark',
    previewBackground: '#814CE2',
    terminal: {
      accent: '#c678dd',
      main: '#282c34',
      text: '#e5c07b',
    },
  },
} as const);
