import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {duotoneDark} from './duotone-dark';
import {styledAutocomplete} from '../../plugins/autocomplete-style';

export const duotoneDarkTheme = createPrismJsTheme({
  id: 'duotoneDark',
  editorTheme: [
    styledAutocomplete({
      background: '#211f2a',
      selectedBackground: '#1d1b28',
      selectedColor: '#9a86fd',
    }),
  ],
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
