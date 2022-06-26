import {createTheme} from '../../core';
import libColors from '@primer/primitives/dist/ts/colors/dark';
import {githubDark} from './githubDark';

export const githubDarkTheme = createTheme({
  id: 'synthwave84',
  editorTheme: githubDark,
  properties: {
    darkMode: true,
    label: 'Github Dark',
    previewBackground:
      'linear-gradient(to right bottom, #d44be1, #c945d7, #be3fcd, #b43ac3, #a934b9, #b330af, #bb2ca6, #c12a9c, #d6308f, #e73c83, #f34d77, #fb5f6d)',
    terminal: {
      main: libColors.codemirror.bg,
      text: libColors.codemirror.text,
      tabs: {
        inactiveTabBackground: libColors.scale.gray[7],
      },
    },
  },
} as const);
