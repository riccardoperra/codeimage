import {createSignal} from 'solid-js';
import type {SwatchVariant} from '../ThemeSwatch';

export interface ThemeStyle {
  readonly id: string;
  /** Shown in the theme style picker. */
  readonly name: string;
  readonly axis: string;
  /** The swatch other places draw for a theme while this style is chosen. */
  readonly mark: SwatchVariant;
}

export const THEME_STYLES = [
  {
    id: 'code',
    name: 'Code',
    axis: 'Fidelity: real highlighted code, large enough to read',
    mark: 'orb',
  },
  {
    id: 'orb',
    name: 'Orb',
    axis: 'Identity: one soft mark per theme on roomy cards',
    mark: 'syntax-orb',
  },
  {
    id: 'aa',
    name: 'Aa list',
    axis: 'Density: one text row per theme, grouped by dark and light',
    mark: 'aa',
  },
  {
    id: 'palette',
    name: 'Palette',
    axis: 'Information: the syntax colours themselves, nothing else',
    mark: 'palette',
  },
  {
    id: 'window',
    name: 'Window',
    axis: 'Miniature: the frame and window you export, with bars for code',
    mark: 'window',
  },
] as const satisfies readonly ThemeStyle[];

export type ThemeStyleId = (typeof THEME_STYLES)[number]['id'];

// Riccardo pointed at T3 Code's orb cards, and the three layouts were built
// around them, so they open in that style.
const DEFAULT_STYLE: ThemeStyleId = 'orb';

export function parseThemeStyle(value: string | null): ThemeStyleId {
  return THEME_STYLES.find(style => style.id === value)?.id ?? DEFAULT_STYLE;
}

export function themeStyleEntry(id: ThemeStyleId) {
  return THEME_STYLES.find(style => style.id === id) ?? THEME_STYLES[1];
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
