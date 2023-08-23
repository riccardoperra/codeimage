import {
  LanguageDefinition,
  PrettierPluginDefinition,
  SUPPORTED_LANGUAGES,
} from '@codeimage/config';
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

const resolveFormatter = (
  pluginDef: LanguageDefinition['prettier'],
  formatterName: string | null | undefined,
) => {
  if (!pluginDef) return;
  if (!Array.isArray(pluginDef)) {
    return pluginDef;
  }
  return !!formatterName
    ? pluginDef.find(def => def.parser === formatterName)
    : pluginDef[0];
};

function makePrettierFormatter(
  language: string,
  tabName: string | null,
  formatterName: string | null | undefined,
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

  const prettierBySelectedLanguage = resolveFormatter(
    selectedLanguage?.prettier,
    formatterName,
  );

  if (!tabName) {
    return {
      parser: prettierBySelectedLanguage?.parser,
      plugins: wrapPluginInPromise(prettierBySelectedLanguage?.plugin?.()),
    };
  }

  const matchedIcons =
    selectedLanguage?.icons.filter(icon => icon.matcher.test(tabName)) ?? [];

  const matchedIcon = matchedIcons[matchedIcons.length - 1];

  if (!matchedIcon) {
    return {
      parser: prettierBySelectedLanguage?.parser,
      plugins: wrapPluginInPromise(prettierBySelectedLanguage?.plugin?.()),
    };
  }

  const prettier = resolveFormatter(
    matchedIcon?.prettier ?? selectedLanguage?.prettier,
    formatterName,
  );
  return {
    parentParser:
      prettierBySelectedLanguage?.parser !== matchedIcon.prettier?.parser
        ? prettierBySelectedLanguage?.parser
        : undefined,
    parser: prettier?.parser,
    plugins: wrapPluginInPromise(prettier?.plugin?.()),
  };
}

export function createPrettierFormatter(
  language: Accessor<string>,
  tabName: Accessor<string>,
  formatterName?: Accessor<string | null | undefined>,
) {
  const getFormatter = () =>
    import('prettier').then(prettier => prettier.format);

  const resolvedFormatter = createMemo(() =>
    makePrettierFormatter(
      language(),
      tabName(),
      formatterName ? formatterName() : null,
    ),
  );

  const canFormat = createMemo(() => {
    const formatter = resolvedFormatter();
    return !!formatter.parser;
  });

  return {
    canFormat,
    availableFormatters(): PrettierPluginDefinition[] {
      const currentLanguage = language();
      const currentTab = tabName();
      const selectedLanguage = SUPPORTED_LANGUAGES.find(
        supportedLanguage => supportedLanguage.id === currentLanguage,
      );
      if (!selectedLanguage || !selectedLanguage.prettier) {
        return [];
      }
      let formatters: PrettierPluginDefinition[] = [];
      const languageFormatters = Array.isArray(selectedLanguage.prettier)
        ? selectedLanguage.prettier
        : [selectedLanguage.prettier];
      formatters = [...formatters, ...languageFormatters];
      // TODO: refactor this code, it's a copypaste
      const matchedIcons =
        selectedLanguage?.icons.filter(icon => icon.matcher.test(currentTab)) ??
        [];
      const matchedIcon = matchedIcons[matchedIcons.length - 1];
      if (!matchedIcon) return formatters;
      if (matchedIcon.prettier) {
        // Formatters by tab name has priority
        formatters = [matchedIcon.prettier, ...formatters];
      }
      return formatters;
    },
    async format(
      code: string,
      options?: Omit<PrettierOptions, 'parser' | 'plugins'>,
      formatterName?: string,
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
      const {parser, plugins, parentParser} = makePrettierFormatter(
        languageDef,
        languageIconDef,
        formatterName,
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
