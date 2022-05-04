import {createTheme} from '../../core';
import {palette} from '../synthwave84/synthwave84';
import {vsCodeDark} from './vscode-dark';

export const vsCodeDarkTheme = createTheme({
  id: 'vsCodeDarkTheme',
  editorTheme: vsCodeDark,
  properties: {
    darkMode: true,
    label: 'VSCode Dark',
    previewBackground: '#529DDA',
    terminal: {
      main: palette.background,
      text: '#FFF',
    },
  },
} as const);
