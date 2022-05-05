import {createTheme} from '../../core';
import {duotoneSea} from './duotone-sea';

export const duotoneSeaTheme = createTheme({
  id: 'duotoneSea',
  editorTheme: duotoneSea,
  properties: {
    darkMode: true,
    label: 'Duotone Sea',
    previewBackground: '#06535d',
    terminal: {
      main: '#1D262F',
      text: '#D6E9FF',
    },
  },
} as const);
