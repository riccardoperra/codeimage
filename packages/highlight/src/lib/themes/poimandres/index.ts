import {createTheme} from '../../core';
import {poimandres, palette} from './poimandres';

export const poimandresTheme = createTheme({
  id: 'poimandres',
  editorTheme: poimandres,
  properties: {
    darkMode: true,
    label: 'Poimandres',
    previewBackground:
      'linear-gradient(140deg, rgb(165, 142, 251), rgb(65, 206, 189))',
    terminal: {
      main: palette.bg,
      text: palette.darkerGray,
    },
  },
} as const);
