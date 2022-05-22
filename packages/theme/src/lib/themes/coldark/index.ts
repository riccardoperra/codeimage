import {createTheme} from '../../core';
import {coldarkCold} from './coldark-cold';
import {coldarkDark, palette} from './coldark-dark';

export const coldarkColdTheme = createTheme({
  id: 'coldarkCold',
  editorTheme: coldarkCold,
  properties: {
    darkMode: false,
    label: 'Coldark Cold',
    previewBackground: 'linear-gradient(-45deg, #402662 0%, #F59ABE 100%)',
    terminal: {
      main: '#e3eaf2',
      text: '#111b27',
    },
  },
} as const);

export const coldarkDarkTheme = createTheme({
  id: 'coldarkDark',
  editorTheme: coldarkDark,
  properties: {
    darkMode: true,
    label: 'Coldark Dark',
    previewBackground:
      'linear-gradient(to left top, #162b46, #192c45, #1c2e45, #1e2f44, #213043)',
    terminal: {
      main: '#111b27',
      text: palette.white,
    },
  },
} as const);
