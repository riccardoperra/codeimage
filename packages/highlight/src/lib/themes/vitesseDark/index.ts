import {createTheme} from '../../core';
import {vitesseDark, palette} from './vitesseDark';

export const vitesseDarkTheme = createTheme({
  id: 'vitesseDark',
  editorTheme: vitesseDark,
  properties: {
    darkMode: true,
    label: 'Vitesse Dark',
    previewBackground: `#0e0e0e`,
    terminal: {
      main: palette.foreground,
      text: palette.string,
    },
  },
} as const);
