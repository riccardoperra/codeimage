import {palette} from '../synthwave84/synthwave84';
import {vsCodeDark} from './vscode-dark';
import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {styledAutocomplete} from '../../plugins/autocomplete-style';

export const vsCodeDarkTheme = createPrismJsTheme({
  id: 'vsCodeDarkTheme',
  editorTheme: [
    styledAutocomplete({
      background: '#1E1E1E',
      selectedBackground: '#191818',
    }),
  ],
  externalStylesheet: vsCodeDark,
  properties: {
    darkMode: true,
    label: 'VSCode Dark',
    previewBackground: '#529DDA',
    terminal: {
      main: palette.background,
      text: '#FFF',
    },
  },
} as const);
