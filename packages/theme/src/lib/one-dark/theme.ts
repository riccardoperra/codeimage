import {buildCustomTheme} from '../core';
import {oneDark} from '@codemirror/theme-one-dark';

export const oneDarkTheme = buildCustomTheme({
  id: 'oneDark',
  editorTheme: oneDark,
  properties: {
    darkMode: true,
    label: 'One dark',
    previewBackground: '#282C34',
  },
});
