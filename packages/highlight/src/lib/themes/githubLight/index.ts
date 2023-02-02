import {createTheme} from '../../core';
import libColors from '@primer/primitives/dist/ts/colors/light';
import {githubLight} from './githubLight';

export const githubLightTheme = createTheme({
  id: 'githubLight',
  editorTheme: githubLight,
  properties: {
    darkMode: false,
    label: 'GitHub Light',
    previewBackground:
      'linear-gradient(-45deg, rgba(73,84,222,1) 0%,rgba(73,221,216,1) 100%)',
    terminal: {
      main: libColors.codemirror.bg,
      text: libColors.codemirror.text,
      tabs: {
        inactiveTabBackground: libColors.scale.gray[1],
      },
    },
  },
} as const);
