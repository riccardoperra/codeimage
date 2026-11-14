import {createTheme} from '../../core';
import {vsCodeLight2026, background, foreground} from './vsCodeLight2026';

export const vsCodeLight2026Theme = createTheme({
  id: 'vsCodeLight2026',
  editorTheme: vsCodeLight2026,
  properties: {
    darkMode: false,
    label: 'VSCode Light 2026',
    previewBackground: 'linear-gradient(135deg, #0069CC 0%, #8250df 100%)',
    terminal: {
      main: background,
      text: foreground,
      tabs: {
        background: '#FAFAFD',
        activeTabBackground: '#FFFFFF',
        inactiveTabBackground: '#FAFAFD',
        textColor: '#202020',
      },
    },
  },
} as const);
