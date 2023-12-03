import {createTheme} from '../../core';
import {palette, xCodeDark} from './xCodeDark';

export const xCodeDarkTheme = createTheme({
  id: 'xCodeDark',
  editorTheme: xCodeDark,
  properties: {
    darkMode: true,
    label: 'XCode Dark',
    previewBackground: `linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)`,
    terminal: {
      main: palette.foreground,
      text: palette.text,
    },
  },
} as const);
