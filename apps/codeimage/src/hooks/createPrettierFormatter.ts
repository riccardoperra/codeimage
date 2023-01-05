import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {
  BuiltInParserName,
  Options as PrettierOptions,
  Plugin as PrettierPlugin,
} from 'prettier';
import {Accessor, createMemo, untrack} from 'solid-js';

interface PrettierParserConfig {
  parser?: BuiltInParserName | string | null;
  parentParser?: BuiltInParserName | string;
  plugins?: Promise<PrettierPlugin[] | null>;
}

const wrapPluginInPromise = (
  plugins: Promise<PrettierPlugin[] | PrettierPlugin> | undefined,
) => {
  return new Promise<PrettierPlugin[]>(async r => {
    if (!plugins) return Promise.resolve([]);
    const resolvedPlugins = await plugins;
    const result = Array.isArray(resolvedPlugins)
      ? resolvedPlugins
      : [resolvedPlugins];
    r(result);
  });
};

function makePrettierFormatter(
  language: string,
  tabName: string | null,
): PrettierParserConfig {
  const selectedLanguage = SUPPORTED_LANGUAGES.find(
    supportedLanguage => supportedLanguage.id === language,
  );
  if (!selectedLanguage) {
    return {
      parser: null,
      plugins: Promise.resolve([]),
      parentParser: undefined,
    };
  }

  if (!tabName) {
    return {
      parser: selectedLanguage?.prettier?.parser,
      plugins: wrapPluginInPromise(selectedLanguage?.prettier?.plugin?.()),
    };
  }

  const matchedIcons =
    selectedLanguage?.icons.filter(icon => icon.matcher.test(tabName)) ?? [];

  const matchedIcon = matchedIcons[matchedIcons.length - 1];

  if (!matchedIcon) {
    return {
      parser: selectedLanguage?.prettier?.parser,
      plugins: wrapPluginInPromise(selectedLanguage?.prettier?.plugin?.()),
    };
  }

  const prettier = matchedIcon?.prettier ?? selectedLanguage?.prettier;
  return {
    parentParser:
      selectedLanguage.prettier?.parser !== matchedIcon.prettier?.parser
        ? selectedLanguage?.prettier?.parser
        : undefined,
    parser: prettier?.parser,
    plugins: wrapPluginInPromise(prettier?.plugin?.()),
  };
}

export function createPrettierFormatter(
  language: Accessor<string>,
  tabName: Accessor<string>,
) {
  const getFormatter = () =>
    import('prettier').then(prettier => prettier.format);

  const resolvedFormatter = createMemo(() =>
    makePrettierFormatter(language(), tabName()),
  );

  const canFormat = createMemo(() => {
    const formatter = resolvedFormatter();
    return !!formatter.parser;
  });

  return {
    canFormat,
    async format(
      code: string,
      options?: Omit<PrettierOptions, 'parser' | 'plugins'>,
    ) {
      if (!untrack(canFormat)) {
        throw new Error('No configuration found');
      }

      const format = await getFormatter();
      const languageDef = language();
      const languageIconDef = tabName();
      if (!languageDef && !languageIconDef) {
        throw new Error('Invalid language definition');
      }
      const {parser, plugins, parentParser} = await makePrettierFormatter(
        languageDef,
        languageIconDef,
      );

      if (!parser) {
        throw new Error('Invalid parser configuration');
      }

      return format(code, {
        ...(options || {}),
        parser,
        plugins: (await plugins) ?? [],
        parentParser: parentParser ?? undefined,
      });
    },
  };
}
