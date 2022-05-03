import {createTheme} from '../../core';
import {materialPalenight, palette} from './material-palenight';

export const materialPalenightTheme = createTheme({
  id: 'materialPalenight',
  editorTheme: materialPalenight,
  properties: {
    darkMode: true,
    label: 'Material Palenight',
    previewBackground: '#1e222f',
    terminal: {
      main: '#292D3E',
      text: palette.gray,
    },
  },
} as const);
