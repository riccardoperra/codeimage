import {createTheme} from '../../core';
import {palette} from '../synthwave84/synthwave84';
import {vsCodeDark} from './vscode-dark';

export const vsCodeDarkTheme = createTheme({
  id: 'vsCodeDarkTheme',
  editorTheme: vsCodeDark,
  properties: {
    darkMode: true,
    label: 'VSCode Dark',
    previewBackground:
      'linear-gradient(to right top, #3547be, #285acd, #186ddb, #047ee7, #0090f2, #0091f3, #0091f4, #0092f5, #0082ec, #0071e2, #0060d7, #174ecb)',
    terminal: {
      main: palette.background,
      text: '#FFF',
    },
  },
} as const);
