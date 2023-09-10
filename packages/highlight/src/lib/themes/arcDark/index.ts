import {createTheme} from '../../core';
import {arkDark, palette} from './arcDark';

export {} from './arcDark';

export const arcDarkTheme = createTheme({
  id: 'arkDark',
  editorTheme: arkDark,
  properties: {
    darkMode: true,
    label: 'Arc Dark',
    previewBackground: `linear-gradient(to right bottom, #393939, #343435, #2f3030, #2b2b2c, #262727)`,
    terminal: {
      main: palette.background,
      text: palette.grayLight,
    },
  },
} as const);
