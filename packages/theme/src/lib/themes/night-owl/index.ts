import {createTheme} from '../../core';
import {nightOwl} from './night-owl';

export const nightOwlTheme = createTheme({
  id: 'nightOwlTheme',
  editorTheme: nightOwl,
  properties: {
    darkMode: true,
    label: 'Night Owl',
    previewBackground: '#15357F',
    terminal: {
      main: '#011627',
      text: '#D0D8E5',
    },
  },
} as const);
