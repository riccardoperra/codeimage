import {CustomTheme} from '@codeimage/highlight';
import {filter} from '@solid-primitives/immutable';
import {Accessor, createSignal, Resource} from 'solid-js';

export function useFilteredThemes(
  $themes: Accessor<Resource<CustomTheme | undefined>[]>,
) {
  const [search, setSearch] = createSignal('');

  const filteredThemes = () => {
    const value = search();
    if (!value || !(value.length > 2)) {
      return $themes();
    }

    return filter($themes(), accessor => {
      const theme = accessor();
      return (
        !!theme &&
        theme.properties.label.toLowerCase().includes(value.toLowerCase())
      );
    });
  };

  const filteredThemeIds = () => {
    return filteredThemes().map(theme => theme()?.id);
  };

  const isMatched = (str: string) => {
    return filteredThemeIds().some(themeId => themeId?.includes(str));
  };

  return [filteredThemes, search, setSearch, isMatched] as const;
}
