import {createSignal} from 'solid-js';
import {AVAILABLE_THEMES} from './Editor/themes';

export function createThemeStore() {
  const [themeId, internalSetThemeId] = createSignal<string>(getInitialValue());

  function getInitialValue() {
    return (
      localStorage.getItem('highlight_theme_default') ?? AVAILABLE_THEMES[0].id
    );
  }

  const theme = () => AVAILABLE_THEMES.find(theme => theme.id === themeId())!;

  return [
    theme,
    (themeId: string) => {
      internalSetThemeId(themeId);
      localStorage.setItem('highlight_theme_default', themeId);
    },
  ] as const;
}
