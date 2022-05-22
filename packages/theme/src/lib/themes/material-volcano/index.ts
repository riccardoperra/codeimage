import {createTheme} from '../../core';
import {materialVolcano, palette} from './materialVolcano';

export const materialVolcanoTheme = createTheme({
  id: 'materialVolcano',
  editorTheme: materialVolcano,
  properties: {
    darkMode: true,
    label: 'Material Volcano',
    previewBackground:
      'linear-gradient(to right bottom, #f66283, #e45475, #d34768, #c2395b, #b12a4e, #a92246, #a1183e, #990d36, #970931, #95052b, #930226, #900020)',
    terminal: {
      main: palette.background,
      text: palette.white,
    },
  },
} as const);
