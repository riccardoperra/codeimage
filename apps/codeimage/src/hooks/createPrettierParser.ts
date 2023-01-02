import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {Options as PrettierOptions} from 'prettier';
import {Accessor} from 'solid-js';
import {createTabIcon} from './use-tab-icon';

export function createPrettierParser(
  language: Accessor<string>,
  tabName: Accessor<string>,
) {
  const languages = SUPPORTED_LANGUAGES;
  const tabIcon = createTabIcon(tabName, language, false);

  const currentLanguage = () => {
    const id = language();
    return languages.find(language => language.id === id);
  };

  const getParser = () => {
    return tabIcon()?.prettier ?? currentLanguage()?.prettier;
  };

  const getParentParser = () => {
    return getParser() !== currentLanguage()?.prettier?.parser
      ? currentLanguage()?.prettier?.parser ?? undefined
      : undefined;
  };

  const getFormatter = () =>
    import('prettier').then(prettier => prettier.format);
  return {
    async parse(
      code: string,
      options?: Omit<PrettierOptions, 'parser' | 'plugins'>,
    ) {
      const format = await getFormatter();
      const languageDef = currentLanguage();
      const languageIconDef = tabIcon();
      if (!languageDef || !languageIconDef) {
        throw new Error('Invalid language definition');
      }
      const parser = getParser();
      const parentParser = getParentParser();

      const plugins = await parser?.plugin?.();

      const resolvedPlugins = plugins
        ? Array.isArray(plugins)
          ? plugins
          : [plugins]
        : [];

      return format(code, {
        ...(options || {}),
        parser: parser?.parser,
        plugins: resolvedPlugins,
        parentParser,
      });
    },
  };
}
