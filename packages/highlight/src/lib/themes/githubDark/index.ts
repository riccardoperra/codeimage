import {createTheme} from '../../core';
import libColors from '@primer/primitives/dist/ts/colors/dark';
import {githubDark} from './githubDark';

export const githubDarkTheme = createTheme({
  id: 'githubDark',
  editorTheme: githubDark,
  properties: {
    darkMode: true,
    label: 'GitHub Dark',
    previewBackground: 'linear-gradient(135deg, #E233FF 0%, #FF6B00 100%)',
    terminal: {
      main: libColors.codemirror.bg,
      text: libColors.codemirror.text,
      tabs: {
        inactiveTabBackground: libColors.scale.gray[7],
      },
    },
  },
} as const);
