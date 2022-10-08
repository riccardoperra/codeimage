import {createTheme} from '../../core';
import {moonlight, palette} from './moonlight';

export const moonlightTheme = createTheme({
  id: 'moonlight',
  editorTheme: moonlight,
  properties: {
    darkMode: true,
    label: 'Moonlight',
    previewBackground: `linear-gradient(135deg, #6a3cc0 0%, #240573 100%)`,
    terminal: {
      main: palette.foreground,
      text: '#e4f3fa',
    },
  },
} as const);
