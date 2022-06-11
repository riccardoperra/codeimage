import {createTheme} from '../../core';
import {vsCodeDark, background} from './vsCodeDark';

export const vsCodeDarkTheme = createTheme({
  id: 'vsCodeDarkTheme',
  editorTheme: vsCodeDark,
  properties: {
    darkMode: true,
    label: 'VSCode Dark',
    previewBackground:
      'linear-gradient(to right bottom, #1cb1f2, #00a9f2, #00a0f2, #0097f1, #008def, #0086f1, #007ff2, #0078f2, #0071f6, #006afa, #0062fd, #0059ff)',
    terminal: {
      main: background,
      text: '#FFF',
    },
  },
} as const);
