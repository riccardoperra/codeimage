import {createTheme} from '../../core';
import {materialPalenight, palette} from './materialPalenight';

export const materialPalenightTheme = createTheme({
  id: 'materialPalenight',
  editorTheme: materialPalenight,
  properties: {
    darkMode: true,
    label: 'Material Palenight',
    previewBackground: 'linear-gradient(135deg, #54D2EF 0%, #2AA6DA 100%)',
    terminal: {
      main: '#24293B',
      text: palette.gray,
    },
  },
} as const);
