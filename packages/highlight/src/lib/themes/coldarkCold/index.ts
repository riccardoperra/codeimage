import {createTheme} from '../../core';
import {coldarkCold} from './coldark-cold';

export const coldarkColdTheme = createTheme({
  id: 'coldarkCold',
  editorTheme: coldarkCold,
  properties: {
    darkMode: false,
    label: 'Coldark Cold',
    previewBackground:
      'linear-gradient(140deg, rgb(165, 142, 251), rgb(233, 191, 248))',
    terminal: {
      accent: '#a04900',
      main: '#fae7ff',
      text: '#111b27',
      tabs: {
        inactiveTabBackground: '#e5d4e9',
      },
    },
  },
} as const);
