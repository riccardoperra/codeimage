import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {nightOwl} from './night-owl';

export const nightOwlTheme = createPrismJsTheme({
  id: 'nightOwlTheme',
  editorTheme: [],
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
});
