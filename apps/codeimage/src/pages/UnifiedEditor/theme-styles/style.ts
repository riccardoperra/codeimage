import {createSignal} from 'solid-js';
import type {SwatchVariant} from '../ThemeSwatch';

export interface ThemeStyle {
  readonly id: string;
  /** The swatch other places draw for a theme while this style is chosen. */
  readonly mark: SwatchVariant;
}

export const THEME_STYLES = [
  {
    id: 'window',
    mark: 'window',
  },
  {
    id: 'orb',
    mark: 'syntax-orb',
  },
  {
    id: 'aa',
    mark: 'aa',
  },
] as const satisfies readonly ThemeStyle[];

export type ThemeStyleId = (typeof THEME_STYLES)[number]['id'];

// Riccardo chose the Window miniature as the default; Orb and Aa list stay
// as alternatives.
const DEFAULT_STYLE: ThemeStyleId = 'window';

export function themeStyleEntry(id: ThemeStyleId) {
  return (
    THEME_STYLES.find(style => style.id === id) ??
    THEME_STYLES.find(style => style.id === DEFAULT_STYLE)!
  );
}

// One choice restyles every picker without re-mounting the layout.
const [themeStyle, setStyle] = createSignal<ThemeStyleId>(DEFAULT_STYLE);

export {themeStyle};

export function setThemeStyle(id: ThemeStyleId): void {
  setStyle(id);
}
