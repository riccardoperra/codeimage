import {createPrismJsTheme} from '../../prismjs/prismjs-theme-factory';
import {duotoneSea} from './duotone-sea';

export const duotoneSeaTheme = createPrismJsTheme({
  id: 'duotoneSea',
  editorTheme: [],
  externalStylesheet: duotoneSea,
  properties: {
    darkMode: true,
    label: 'Duotone Sea',
    previewBackground: '#06535d',
    terminal: {
      main: '#1D262F',
      text: '#D6E9FF',
    },
  },
});
