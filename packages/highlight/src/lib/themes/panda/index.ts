import {createTheme} from '../../core';
import {panda, palette} from './panda';

export const pandaTheme = createTheme({
  id: 'panda',
  editorTheme: panda,
  properties: {
    darkMode: true,
    label: 'Panda',
    previewBackground: `#1a1a1a`,
    terminal: {
      main: palette.background,
      text: palette.text,
    },
  },
} as const);
