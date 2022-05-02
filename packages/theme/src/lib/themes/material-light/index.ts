import {createTheme} from '../../core';
import {materialLight} from './material-light';

export const materialLightTheme = createTheme({
  id: 'materialLightTheme',
  editorTheme: materialLight,
  properties: {
    darkMode: false,
    label: 'Material Light',
    previewBackground: '#d4b8ff',
    terminal: {
      main: '#ffffff',
      text: '#90a4ae',
    },
  },
} as const);
