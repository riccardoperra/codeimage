import {createTheme} from '../../core';
import {materialOcean, palette} from './theme';

export const materialOceanTheme = createTheme({
  id: 'materialOcean',
  editorTheme: materialOcean,
  properties: {
    darkMode: true,
    label: 'Material Ocean',
    previewBackground: palette.defaultAccent,
    terminal: {
      main: palette.backgroundAlt,
      text: palette.white,
    },
  },
} as const);
