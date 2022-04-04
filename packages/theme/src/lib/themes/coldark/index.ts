import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {coldarkCold} from './coldark-cold';
import {coldarkDark} from './coldark-dark';
import {styledAutocomplete} from '../../plugins/autocomplete-style';

export const coldarkColdTheme = createPrismJsTheme({
  id: 'coldarkCold',
  editorTheme: [],
  externalStylesheet: coldarkCold,
  properties: {
    darkMode: false,
    label: 'Coldark Cold',
    previewBackground: '#A2B1D2',
    terminal: {
      main: '#e3eaf2',
      text: '#111b27',
    },
  },
} as const);

export const coldarkDarkTheme = createPrismJsTheme({
  id: 'coldarkDark',
  editorTheme: [
    styledAutocomplete({
      background: '#142231',
      selectedBackground: '#122335',
      selectedColor: '#e9ae7e',
    }),
  ],
  externalStylesheet: coldarkDark,
  properties: {
    darkMode: true,
    label: 'Coldark Dark',
    previewBackground: '#213043',
    terminal: {
      main: '#111b27',
      text: '#FFF',
    },
  },
} as const);
