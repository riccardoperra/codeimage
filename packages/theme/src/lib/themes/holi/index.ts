import {holi} from './holi';
import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';

export const holiTheme = createPrismJsTheme({
  id: 'holiTheme',
  editorTheme: [],
  externalStylesheet: holi,
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
