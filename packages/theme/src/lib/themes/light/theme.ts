import {defaultHighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {createTheme} from '../../core';

export const lightTheme = createTheme({
  id: 'oneLight',
  editorTheme: [syntaxHighlighting(defaultHighlightStyle, {fallback: true})],
  properties: {
    darkMode: false,
    label: 'One light',
    previewBackground: '#0d6985',
    terminal: {
      main: '#ffffff',
      text: '#000000',
    },
  },
});
