import type {CustomTheme} from '@codeimage/highlight';
import type {Accessor, Resource} from 'solid-js';
import {createSignal} from 'solid-js';

export function useFilteredThemes(
  $themes: Accessor<Resource<CustomTheme | undefined>[]>,
) {
  const [search, setSearch] = createSignal('');

  const filteredThemes = () => {
    const value = search();
    if (!value || !(value.length > 2)) {
      return $themes();
    }

    return $themes().filter(
      theme =>
        !!theme() &&
        theme()!.properties.label.toLowerCase().includes(value.toLowerCase()),
    );
  };

  const filteredThemeIds = () => {
    return filteredThemes().map(theme => theme()?.id);
  };

  const isMatched = (str: string) => {
    return filteredThemeIds().some(themeId => themeId?.includes(str));
  };

  return [filteredThemes, search, setSearch, isMatched] as const;
}
