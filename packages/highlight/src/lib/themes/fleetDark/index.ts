import {createTheme} from '../../core';
import {fleetDark, palette} from './fleetDark';

export const fleetDarkTheme = createTheme({
  id: 'fleetDark',
  editorTheme: fleetDark,
  properties: {
    darkMode: true,
    label: 'Fleet Dark',
    previewBackground: `linear-gradient(152deg, rgb(87% 61% 43%) 0%, rgb(49% 14% 95%) 100%)`,
    terminal: {
      accent: '#82d2ce',
      main: palette.background,
      text: '#fff',
    },
  },
} as const);
