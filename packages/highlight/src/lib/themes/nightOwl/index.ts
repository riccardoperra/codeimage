import {createTheme} from '../../core';
import {nightOwl} from './nightOwl';

export const nightOwlTheme = createTheme({
  id: 'nightOwlTheme',
  editorTheme: nightOwl,
  properties: {
    darkMode: true,
    label: 'Night Owl',
    previewBackground:
      'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
    terminal: {
      main: '#041c31',
      text: '#D0D8E5',
      tabs: {
        background: '#132d43',
        inactiveTabBackground: '#021525',
      },
    },
  },
} as const);
