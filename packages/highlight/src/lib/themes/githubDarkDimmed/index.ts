import libColors from '@primer/primitives/dist/ts/colors/dark_dimmed';
import {createTheme} from '../../core';
import {githubDarkDimmed} from './githubDarkDimmed';

export const githubDarkDimmedTheme = createTheme({
  id: 'githubDarkDimmed',
  editorTheme: githubDarkDimmed,
  properties: {
    darkMode: true,
    label: 'GitHub Dark Dimmed',
    previewBackground:
      'linear-gradient(140deg, rgb(241 160 61), rgb(192 74 65),  rgb(115, 52, 52))',
    terminal: {
      main: libColors.codemirror.bg,
      text: libColors.codemirror.text,
      tabs: {
        inactiveTabBackground: libColors.scale.gray[7],
      },
    },
  },
} as const);
