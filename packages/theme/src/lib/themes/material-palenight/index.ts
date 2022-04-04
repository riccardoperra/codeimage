import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {materialPalenight} from './material-palenight';
import {styledAutocomplete} from '../../plugins/autocomplete-style';

export const materialPalenightTheme = createPrismJsTheme({
  id: 'materialPalenight',
  editorTheme: [
    styledAutocomplete({
      background: '#1f212e',
      selectedBackground: '#181923',
      selectedColor: '#FFCB6B',
    }),
  ],
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
