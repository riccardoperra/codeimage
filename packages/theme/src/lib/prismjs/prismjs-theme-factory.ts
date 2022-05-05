import {createThemeFactory, CustomTheme} from '../core';
import {prismjsClassNames} from './prismjsClassNames';

type PrismJsTheme<T extends CustomTheme> = Omit<T, 'id'> & {
  id: `prismjs-${T['id']}`;
};

/**
 * @deprecated Use `defineEditorTheme` api
 */
export const createPrismJsTheme = createThemeFactory(
  '@codeimage/prismjs-theme',
  <T extends CustomTheme, Id extends string>(theme: T): PrismJsTheme<T> => {
    theme.id = `prismjs-${theme.id}` as `prismjs-${Id}`;
    theme.editorTheme = [prismjsClassNames, theme.editorTheme || []];
    return theme as PrismJsTheme<T>;
  },
);
