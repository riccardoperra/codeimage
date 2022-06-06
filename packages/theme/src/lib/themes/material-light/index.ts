import {createTheme} from '../../core';
import {materialLight} from './material-light';

export const materialLightTheme = createTheme({
  id: 'materialLightTheme',
  editorTheme: materialLight,
  properties: {
    darkMode: false,
    label: 'Material Light',
    previewBackground: 'linear-gradient(135deg, #54D2EF 0%, #2AA6DA 100%)',
    terminal: {
      main: '#ffffff',
      text: '#90a4ae',
      tabs: {
        inactiveTabBackground: '#e5e5e5',
        textColor: '#000',
      },
    },
  },
} as const);
