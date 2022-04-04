import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {duotoneSea} from './duotone-sea';
import {styledAutocomplete} from '../../plugins/autocomplete-style';

export const duotoneSeaTheme = createPrismJsTheme({
  id: 'duotoneSea',
  editorTheme: [
    styledAutocomplete({
      background: '#06535d',
      selectedBackground: '#043f45',
      selectedColor: '#D6E9FF',
    }),
  ],
  externalStylesheet: duotoneSea,
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
