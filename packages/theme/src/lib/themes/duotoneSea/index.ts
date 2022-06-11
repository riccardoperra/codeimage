import {createTheme} from '../../core';
import {duotoneSea} from './duotoneSea';

export const duotoneSeaTheme = createTheme({
  id: 'duotoneSea',
  editorTheme: duotoneSea,
  properties: {
    darkMode: true,
    label: 'Duotone Sea',
    previewBackground:
      'linear-gradient(to right bottom, #1e737e, #186b76, #13636d, #0d5b65, #06535d)',
    terminal: {
      main: '#1D262F',
      text: '#D6E9FF',
    },
  },
} as const);
