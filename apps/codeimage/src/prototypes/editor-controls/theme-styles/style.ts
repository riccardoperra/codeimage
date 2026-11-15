import type {LocaleKeys} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../i18n';
import {createSignal} from 'solid-js';
import type {SwatchVariant} from '../ThemeSwatch';

export interface ThemeStyle {
  readonly id: string;
  /** Shown in the theme style picker. */
  readonly name: LocaleKeys<AppLocaleEntries>;
  readonly axis: string;
  /** The swatch other places draw for a theme while this style is chosen. */
  readonly mark: SwatchVariant;
}

export const THEME_STYLES = [
  {
    id: 'window',
    name: 'frame.terminal',
    axis: 'Miniature: the frame and window you export, with bars for code',
    mark: 'window',
  },
  {
    id: 'orb',
    name: 'editor.orb',
    axis: 'Identity: one soft mark per theme on roomy cards',
    mark: 'syntax-orb',
  },
  {
    id: 'aa',
    name: 'editor.aa',
    axis: 'Density: one text row per theme, grouped by dark and light',
    mark: 'aa',
  },
] as const satisfies readonly ThemeStyle[];

export type ThemeStyleId = (typeof THEME_STYLES)[number]['id'];

// Riccardo chose the Window miniature as the default; Orb and Aa list stay
// as alternatives.
const DEFAULT_STYLE: ThemeStyleId = 'window';

export function parseThemeStyle(value: string | null): ThemeStyleId {
  return THEME_STYLES.find(style => style.id === value)?.id ?? DEFAULT_STYLE;
}

export function themeStyleEntry(id: ThemeStyleId) {
  return (
    THEME_STYLES.find(style => style.id === id) ??
    THEME_STYLES.find(style => style.id === DEFAULT_STYLE)!
  );
}

// One choice for the page, read from and written to the `t` URL parameter,
// so that a switch restyles every picker without re-mounting the layout.
const [themeStyle, setStyle] = createSignal<ThemeStyleId>(
  parseThemeStyle(new URLSearchParams(location.search).get('t')),
);

export {themeStyle};

export function setThemeStyle(id: ThemeStyleId): void {
  const url = new URL(location.href);
  url.searchParams.set('t', id);
  history.replaceState(history.state, '', url);
  setStyle(id);
}
