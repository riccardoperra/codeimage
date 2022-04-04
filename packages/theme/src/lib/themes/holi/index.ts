import {holi} from './holi';
import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {styledAutocomplete} from '../../plugins/autocomplete-style';

export const holiTheme = createPrismJsTheme({
  id: 'holiTheme',
  editorTheme: [
    styledAutocomplete({
      background: '#122f6d',
      selectedBackground: '#1a1a82',
      selectedColor: '#d6b007',
    }),
  ],
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
