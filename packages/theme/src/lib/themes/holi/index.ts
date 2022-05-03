import {createTheme} from '../../core';
import {holi} from './holi';

export const holiTheme = createTheme({
  id: 'holiTheme',
  editorTheme: holi,
  properties: {
    darkMode: true,
    label: 'Holi Dark',
    previewBackground: '#122f6d',
    terminal: {
      main: '#030314',
      text: '#FFF',
    },
  },
} as const);
