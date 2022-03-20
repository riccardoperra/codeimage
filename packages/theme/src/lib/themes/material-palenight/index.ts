import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {materialPalenight} from './material-palenight';

export const materialPalenightTheme = createPrismJsTheme({
  id: 'materialPalenight',
  editorTheme: [],
  externalStylesheet: materialPalenight,
  properties: {
    darkMode: true,
    label: 'Material Palenight',
    previewBackground: '#1e222f',
    terminal: {
      main: '#292D3E',
      text: '#D6E9FF',
    },
  },
} as const);
