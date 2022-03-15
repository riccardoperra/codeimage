import {createThemeFactory} from '../core';
import {prismjsClassNames} from './prismjsClassNames';

export const createPrismJsTheme = createThemeFactory(
  '@codeimage/prismjs-theme',
  theme => {
    theme.id = `prismjs-${theme.id}`;
    theme.editorTheme = [prismjsClassNames, theme.editorTheme || []];
    return theme;
  },
);
