import {createTheme} from '../../core';
import {palette, synthwave84} from './synthwave84';

export const synthwave84Theme = createTheme({
  id: 'synthwave84',
  editorTheme: synthwave84,
  properties: {
    darkMode: true,
    label: "Synthwave '84",
    previewBackground: `linear-gradient(to right top, #7f469d, #8242aa, #833db7, #8338c4, #8233d2, #8a35da, #9336e2, #9b38ea, #af41ee, #c24af2, #d554f7, #e65ffb)`,
    terminal: {
      main: palette.background,
      text: palette.white,
      tabs: {
        inactiveTabBackground: '#1f1637',
      },
    },
  },
} as const);
