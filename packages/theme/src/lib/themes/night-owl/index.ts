import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {nightOwl} from './night-owl';
import {styledAutocomplete} from '../../plugins/autocomplete-style';

export const nightOwlTheme = createPrismJsTheme({
  id: 'nightOwlTheme',
  editorTheme: [
    styledAutocomplete({
      background: '#011423',
      border: '#5f7e97',
      selectedBackground: '#011220',
      selectedColor: 'rgb(247, 140, 108)',
    }),
  ],
  externalStylesheet: nightOwl,
  properties: {
    darkMode: true,
    label: 'Night Owl',
    previewBackground: '#091c43',
    terminal: {
      main: '#011627',
      text: '#D0D8E5',
    },
  },
} as const);
