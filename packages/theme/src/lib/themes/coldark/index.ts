import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {coldarkCold} from './coldark-cold';
import {coldarkDark} from './coldark-dark';

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
});

export const coldarkDarkTheme = createPrismJsTheme({
  id: 'coldarkDark',
  editorTheme: [],
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
});
