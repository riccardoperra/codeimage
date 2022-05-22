import {createTheme} from '../../core';
import {nightOwl} from './night-owl';

export const nightOwlTheme = createTheme({
  id: 'nightOwlTheme',
  editorTheme: nightOwl,
  properties: {
    darkMode: true,
    label: 'Night Owl',
    previewBackground: 'linear-gradient(135deg, #FFE174 0%, #FFBF40 100%)',
    terminal: {
      main: '#011627',
      text: '#D0D8E5',
    },
  },
} as const);
