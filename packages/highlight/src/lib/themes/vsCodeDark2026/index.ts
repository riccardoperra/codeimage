import {createTheme} from '../../core';
import {vsCodeDark2026, background, foreground} from './vsCodeDark2026';

export const vsCodeDark2026Theme = createTheme({
  id: 'vsCodeDark2026',
  editorTheme: vsCodeDark2026,
  properties: {
    darkMode: true,
    label: 'VSCode Dark 2026',
    previewBackground: 'linear-gradient(135deg, #3994BC 0%, #d2a8ff 100%)',
    terminal: {
      main: background,
      text: foreground,
      tabs: {
        background: '#191A1B',
        activeTabBackground: '#121314',
        inactiveTabBackground: '#191A1B',
        textColor: '#bfbfbf',
      },
    },
  },
} as const);
