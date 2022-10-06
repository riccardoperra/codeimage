import {createTheme} from '../../core';
import {panda, palette} from './panda';

export const pandaTheme = createTheme({
  id: 'panda',
  editorTheme: panda,
  properties: {
    darkMode: true,
    label: 'panda',
    previewBackground: ``,
    terminal: {
      main: palette.background,
      text: palette.text,
    },
  },
} as const);
