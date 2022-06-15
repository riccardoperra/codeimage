import {createTheme} from '../../core';
import {materialOcean, palette} from './theme';

export const materialOceanTheme = createTheme({
  id: 'materialOcean',
  editorTheme: materialOcean,
  properties: {
    darkMode: true,
    label: 'Material Ocean',
    previewBackground: `linear-gradient(to right bottom, #2be7b5, #1edea2, #16d58f, #13cb7c, #16c268, #0db866, #04ae64, #00a462, #00976c, #008971, #007b72, #006d6d)`,
    terminal: {
      main: palette.backgroundAlt,
      text: palette.white,
      tabs: {
        inactiveTabBackground: '#152025',
      },
    },
  },
} as const);
