import {createTheme} from '../../core';
import {materialVolcano, palette} from './materialVolcano';

export const materialVolcanoTheme = createTheme({
  id: 'materialVolcano',
  editorTheme: materialVolcano,
  properties: {
    darkMode: true,
    label: 'Material Volcano',
    previewBackground: '#AB5959',
    terminal: {
      main: palette.background,
      text: palette.white,
    },
  },
} as const);
