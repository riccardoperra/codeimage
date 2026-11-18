import type {PrettierPluginDefinition} from '@codeimage/config';
import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import type {Accessor} from 'solid-js';
import {createMemo} from 'solid-js';
import {formattingJson} from '@codeimage/store/editor/formatting-json';

export function createPrettierFormatter(
  language: Accessor<string>,
  tabName: Accessor<string>,
  formatterName: Accessor<string | null>,
) {
  const availableFormatters = createMemo((): PrettierPluginDefinition[] => {
    const selected = SUPPORTED_LANGUAGES.find(entry => entry.id === language());
    if (!selected?.prettier) return [];

    const plugin = selected.icons
      .filter(icon => icon.matcher.test(tabName()))
      .at(-1)?.prettier;
    const base = Array.isArray(selected.prettier)
      ? selected.prettier
      : [selected.prettier];

    return plugin && !base.some(entry => entry.parser === plugin.parser)
      ? [plugin, ...base]
      : base;
  });

  const selectedFormatter = createMemo(() => {
    const name = formatterName();
    const candidates = availableFormatters();
    return candidates.find(entry => entry.parser === name) ?? candidates[0];
  });

  return {
    availableFormatters,
    canFormat: () => !!selectedFormatter()?.parser,
    async format(code: string) {
      const selected = selectedFormatter();
      if (!selected?.parser) throw new Error('No formatter for this language');

      const {parser} = selected;
      const [options, prettier, loaded, estree] = await Promise.all([
        formattingJson.activeOptions(),
        import('prettier/standalone'),
        selected.plugin?.(),
        parser === 'json-stringify' || parser === 'json5'
          ? import('prettier/plugins/estree')
          : undefined,
      ]);
      const plugins = Array.isArray(loaded) ? loaded : [loaded];
      const resolvedPlugins = plugins.filter(plugin => plugin !== undefined);
      return prettier.format(code, {
        ...options,
        parser,
        plugins: estree ? [...resolvedPlugins, estree] : resolvedPlugins,
      });
    },
  };
}
