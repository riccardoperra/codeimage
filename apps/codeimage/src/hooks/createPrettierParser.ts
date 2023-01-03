import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {
  BuiltInParserName,
  Options as PrettierOptions,
  Plugin as PrettierPlugin,
} from 'prettier';
import {Accessor} from 'solid-js';

interface PrettierParserConfig {
  parser?: BuiltInParserName | string | null;
  parentParser?: BuiltInParserName | string;
  plugins?: PrettierPlugin[] | null;
}

const unwrapPlugins = (
  plugins: Promise<PrettierPlugin[] | PrettierPlugin> | undefined,
) => {
  if (!plugins) return [];
  return plugins.then(plugin => {
    return Array.isArray(plugin) ? plugin : [plugin];
  });
};

async function makePrettierParser(
  language: string,
  tabName: string | null,
): Promise<PrettierParserConfig> {
  const selectedLanguage = SUPPORTED_LANGUAGES.find(
    supportedLanguage => supportedLanguage.id === language,
  );
  if (!selectedLanguage) {
    return {
      parser: null,
      plugins: [],
      parentParser: undefined,
    };
  }

  if (!tabName) {
    return {
      parser: selectedLanguage?.prettier?.parser ?? 'babel',
      plugins: await unwrapPlugins(selectedLanguage?.prettier?.plugin?.()),
    };
  }

  const matchedIcons =
    selectedLanguage?.icons.filter(icon => icon.matcher.test(tabName)) ?? [];

  const matchedIcon = matchedIcons[matchedIcons.length - 1];

  if (!matchedIcon) {
    return {
      parser: selectedLanguage?.prettier?.parser ?? 'babel',
      plugins: await unwrapPlugins(selectedLanguage?.prettier?.plugin?.()),
    };
  }

  const prettier = matchedIcon?.prettier ?? selectedLanguage?.prettier;
  return {
    parentParser:
      selectedLanguage.prettier?.parser !== matchedIcon.prettier?.parser
        ? selectedLanguage?.prettier?.parser
        : undefined,
    parser: prettier?.parser,
    plugins: await unwrapPlugins(prettier?.plugin?.()),
  };
}

export function createPrettierParser(
  language: Accessor<string>,
  tabName: Accessor<string>,
) {
  const getFormatter = () =>
    import('prettier').then(prettier => prettier.format);
  return {
    async parse(
      code: string,
      options?: Omit<PrettierOptions, 'parser' | 'plugins'>,
    ) {
      const format = await getFormatter();
      const languageDef = language();
      const languageIconDef = tabName();
      if (!languageDef && !languageIconDef) {
        throw new Error('Invalid language definition');
      }
      const {parser, plugins, parentParser} = await makePrettierParser(
        languageDef,
        languageIconDef,
      );

      if (!parser || !plugins) {
        throw new Error('Invalid parser configuration');
      }

      return format(code, {
        ...(options || {}),
        parser,
        plugins,
        parentParser: parentParser ?? undefined,
      });
    },
  };
}
