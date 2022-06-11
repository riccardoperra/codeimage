import {defaultHighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {createTheme} from '../../core';

export const lightTheme = createTheme({
  id: 'oneLight',
  editorTheme: [syntaxHighlighting(defaultHighlightStyle, {fallback: true})],
  properties: {
    darkMode: false,
    label: 'One light',
    previewBackground: 'linear-gradient(62deg, #8EC5FC 0%, #E0C3FC 100%)',
    terminal: {
      main: '#ffffff',
      text: '#000000',
      tabs: {
        inactiveTabBackground: '#e5e5e5',
      },
    },
  },
});
