import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {duotoneDark} from './duotone-dark';

export const duotoneDarkTheme = createPrismJsTheme({
  id: 'duotoneDark',
  editorTheme: [],
  externalStylesheet: duotoneDark,
  properties: {
    darkMode: true,
    label: 'Duotone Dark',
    previewBackground: '#7840ba',
    terminal: {
      main: '#2D2B38',
      text: '#FFFFFF',
    },
  },
} as const);
