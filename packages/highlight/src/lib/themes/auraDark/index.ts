import {createTheme} from '../../core';
import {aura, palette} from './aura';

export const auraTheme = createTheme({
  id: 'aura',
  editorTheme: aura,
  properties: {
    darkMode: true,
    label: 'Aura Dark',
    previewBackground: `linear-gradient(135deg,  rgba(171,73,222,1) 0%,rgba(73,84,222,1) 100%)`,
    terminal: {
      main: palette.background,
      text: palette.purple,
    },
  },
} as const);
