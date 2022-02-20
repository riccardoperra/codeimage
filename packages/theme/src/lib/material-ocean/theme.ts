import {buildCustomTheme} from '../core';
import {materialOceanic, palette} from './vs';

export const materialOceanTheme = buildCustomTheme({
  id: 'materialOcean',
  editorTheme: materialOceanic,
  properties: {
    darkMode: true,
    label: 'Material Ocean',
    previewBackground: palette.defaultAccent,
    terminal: {
      main: palette.backgroundAlt,
      text: palette.base.white,
    },
  },
});
