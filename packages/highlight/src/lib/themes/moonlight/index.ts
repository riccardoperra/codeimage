import {createTheme} from '../../core';
import {moonlight} from './moonlight';

export const moonlightTheme = createTheme({
  id: 'moonlight',
  editorTheme: moonlight,
  properties: {
    darkMode: true,
    label: 'Moonlight',
    previewBackground: ``,
    terminal: {
      main: '#212539',
      text: '#e4f3fa',
    },
  },
} as const);
