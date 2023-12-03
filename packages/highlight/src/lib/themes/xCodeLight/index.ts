import {createTheme} from '../../core';
import {xCodeLight, palette} from './xCodeLight';

export const xCodeLightTheme = createTheme({
  id: 'xCodeLight',
  editorTheme: xCodeLight,
  properties: {
    darkMode: false,
    label: 'XCode Light',
    previewBackground: `linear-gradient(to right bottom, #ffcc99, #f6bd83, #edad6e, #e49e59, #da8f44)`,
    terminal: {
      main: palette.foreground,
      text: palette.text,
    },
  },
} as const);
