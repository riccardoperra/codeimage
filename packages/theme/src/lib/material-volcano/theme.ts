import {buildCustomTheme} from '../core';
import {materialVolcano, palette} from './materialVolcano';

export const materialVolcanoTheme = buildCustomTheme({
  id: 'materialVolcano',
  editorTheme: materialVolcano,
  properties: {
    darkMode: true,
    label: 'Material Volcano',
    previewBackground: '#966F4F',
    terminal: {
      main: palette.background,
      text: palette.white,
    },
  },
});
