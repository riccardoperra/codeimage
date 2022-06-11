import {createTheme} from '../../core';
import {materialVolcano, palette} from './materialVolcano';

export const materialVolcanoTheme = createTheme({
  id: 'materialVolcano',
  editorTheme: materialVolcano,
  properties: {
    darkMode: true,
    label: 'Material Volcano',
    previewBackground:
      'linear-gradient(140deg, rgb(241, 160, 61), rgb(192, 74, 65), rgb(115, 52, 52))',
    terminal: {
      main: palette.background,
      text: palette.white,
      tabs: {
        background: '#501316',
        activeTabBackground: palette.background,
        inactiveTabBackground: '#3d0606',
        textColor: palette.white,
      },
    },
  },
} as const);
