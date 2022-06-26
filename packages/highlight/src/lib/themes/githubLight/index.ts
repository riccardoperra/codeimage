import {createTheme} from '../../core';
import libColors from '@primer/primitives/dist/ts/colors/light';
import {githubLight} from './githubLight';

export const githubLightTheme = createTheme({
  id: 'githubLight',
  editorTheme: githubLight,
  properties: {
    darkMode: false,
    label: 'Github Light',
    previewBackground:
      'linear-gradient(to right bottom, #d44be1, #c945d7, #be3fcd, #b43ac3, #a934b9, #b330af, #bb2ca6, #c12a9c, #d6308f, #e73c83, #f34d77, #fb5f6d)',
    terminal: {
      main: libColors.codemirror.bg,
      text: libColors.codemirror.text,
      tabs: {
        inactiveTabBackground: libColors.scale.gray[1],
      },
    },
  },
} as const);
