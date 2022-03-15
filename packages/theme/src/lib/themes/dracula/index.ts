import {createTheme} from '../../core';
import {dracula, palette} from './dracula';

export const draculaTheme = createTheme({
  id: 'dracula',
  editorTheme: dracula,
  properties: {
    darkMode: true,
    label: 'Dracula',
    previewBackground: palette.purple,
    terminal: {
      main: palette.background,
      text: palette.purple,
    },
  },
});
