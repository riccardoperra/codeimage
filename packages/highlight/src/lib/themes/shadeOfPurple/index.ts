import {createTheme} from '../../core';
import {shadeOfPurple, palette} from './shadeOfPurple';

export const shadeOfPurpleTheme = createTheme({
  id: 'shadeOfPurple',
  editorTheme: shadeOfPurple,
  properties: {
    darkMode: true,
    label: 'Shades Of Purple',
    previewBackground: `#222244`,
    terminal: {
      main: palette.foreground,
      text: palette.text,
    },
  },
} as const);
