import {materialLight} from './material-light';
import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {styledAutocomplete} from '../../plugins/autocomplete-style';

export const materialLightTheme = createPrismJsTheme({
  id: 'materialLightTheme',
  editorTheme: [
    styledAutocomplete({
      background: '#fff',
      selectedBackground: '#a971ff',
      selectedColor: '#fff',
      border: '#a971ff',
    }),
  ],
  externalStylesheet: materialLight,
  properties: {
    darkMode: false,
    label: 'Material Light',
    previewBackground: '#d4b8ff',
    terminal: {
      main: '#ffffff',
      text: '#90a4ae',
    },
  },
} as const);
