import {createTheme} from '../../core';
import {dracula, palette} from './dracula';

export const draculaTheme = createTheme({
  id: 'dracula',
  editorTheme: dracula,
  properties: {
    darkMode: true,
    label: 'Dracula',
    previewBackground: `linear-gradient(135deg,  rgba(171,73,222,1) 0%,rgba(73,84,222,1) 100%)`,
    terminal: {
      main: palette.background,
      text: palette.purple,
    },
  },
} as const);
