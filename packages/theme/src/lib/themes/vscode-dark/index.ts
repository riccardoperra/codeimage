import {palette} from '../synthwave84/synthwave84';
import {vsCodeDark} from './vscode-dark';
import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';

export const vsCodeDarkTheme = createPrismJsTheme({
  id: 'vsCodeDarkTheme',
  editorTheme: [],
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
});
