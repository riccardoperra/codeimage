import {createTheme} from '../../core';
import {monokaiPro, palette} from './monokaiPro';

export const monokaiProTheme = createTheme({
  id: 'monokaiPro',
  editorTheme: monokaiPro,
  properties: {
    darkMode: true,
    label: 'Monokai Pro',
    previewBackground: ``,
    terminal: {
      main: palette.foreground,
      text: palette.text,
    },
  },
} as const);
