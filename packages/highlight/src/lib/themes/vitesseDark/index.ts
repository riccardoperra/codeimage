import {createTheme} from '../../core';
import {vitesseDark, palette} from './vitesseDark';

export const vitesseDarkTheme = createTheme({
  id: 'vitesseDark',
  editorTheme: vitesseDark,
  properties: {
    darkMode: true,
    label: 'Vitesse Dark',
    previewBackground: `linear-gradient(0deg, #6394bf, #a1b567)`,
    terminal: {
      main: palette.foreground,
      text: palette.string,
    },
  },
} as const);
