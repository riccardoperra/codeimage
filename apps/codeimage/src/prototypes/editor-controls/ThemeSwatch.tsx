import type {JSX} from 'solid-js';
import {Match, Switch} from 'solid-js';
import type {ThemeEntry} from './model';
import {themeStyle, themeStyleEntry} from './theme-styles/style';
import './theme-swatch.css';

export const SWATCH_VARIANTS = [
  'orb',
  'syntax-orb',
  'aa',
  'palette',
  'window',
] as const;

export type SwatchVariant = (typeof SWATCH_VARIANTS)[number];

interface ThemeSwatchProps {
  theme: ThemeEntry;
  /** Height in px, and the diameter of the round styles. Defaults to 56. */
  size?: number;
  /** Width in px of `palette` and `window`, or `fill` for the width of the parent. Defaults to `size`. */
  width?: number | 'fill';
  /** Defaults to the mark of the theme style chosen in the harness (the `t` URL parameter). */
  variant?: SwatchVariant;
}

/**
 * One theme as a small mark, in one of several styles:
 * - `orb`: the frame background with the window colour in a corner.
 * - `syntax-orb`: soft blobs of the keyword, string and function colours on the window colour.
 * - `aa`: "Aa" in the keyword and string colours on the window colour.
 * - `palette`: the window colour with dots of six syntax colours.
 * - `window`: a window with bars of code colours on the frame background.
 */
export function ThemeSwatch(props: ThemeSwatchProps) {
  const variant = () => props.variant ?? themeStyleEntry(themeStyle()).mark;
  const size = () => props.size ?? 56;
  const width = () => props.width ?? size();
  const syntax = () => props.theme.colors.syntax;
  const wide = () => {
    const value = width();
    return value === 'fill' || value >= size() * 1.6;
  };
  const dot = () => {
    const value = width();
    if (value === 'fill') return size() * 0.24;
    return wide() ? Math.min(size() * 0.26, value / 9) : size() * 0.18;
  };

  const style = (): JSX.CSSProperties => ({
    '--swatch-size': `${size()}px`,
    '--swatch-width': width() === 'fill' ? '100%' : `${width()}px`,
    '--swatch-dot': `${dot()}px`,
    '--swatch-frame': props.theme.colors.background,
    '--swatch-window': props.theme.colors.window,
    '--swatch-text': props.theme.colors.text,
    '--swatch-base': syntax().base,
    '--swatch-keyword': syntax().keyword,
    '--swatch-string': syntax().string,
    '--swatch-function': syntax().function,
    '--swatch-number': syntax().number,
    '--swatch-type': syntax().type,
    '--swatch-property': syntax().property,
    '--swatch-comment': syntax().comment,
  });

  return (
    <span
      class="proto-theme-swatch"
      data-variant={variant()}
      data-wide={wide() ? '' : undefined}
      aria-hidden="true"
      style={style()}
    >
      <Switch>
        <Match when={variant() === 'orb'}>
          <span class="proto-theme-swatch-window" />
          <span class="proto-theme-swatch-text" />
        </Match>
        <Match when={variant() === 'syntax-orb'}>
          <span class="proto-theme-swatch-blob" data-token="keyword" />
          <span class="proto-theme-swatch-blob" data-token="string" />
          <span class="proto-theme-swatch-blob" data-token="function" />
        </Match>
        <Match when={variant() === 'aa'}>
          <span class="proto-theme-swatch-aa">
            <span style={{color: syntax().keyword}}>A</span>
            <span style={{color: syntax().string}}>a</span>
          </span>
        </Match>
        <Match when={variant() === 'palette'}>
          <span class="proto-theme-swatch-dots">
            <span style={{background: syntax().keyword}} />
            <span style={{background: syntax().string}} />
            <span style={{background: syntax().function}} />
            <span style={{background: syntax().number}} />
            <span style={{background: syntax().type}} />
            <span style={{background: syntax().property}} />
          </span>
        </Match>
        <Match when={variant() === 'window'}>
          <span class="proto-theme-swatch-editor">
            <span class="proto-theme-swatch-line">
              <span style={{background: syntax().keyword, width: '24%'}} />
              <span style={{background: syntax().function, width: '38%'}} />
            </span>
            <span class="proto-theme-swatch-line" data-indent>
              <span style={{background: syntax().property, width: '28%'}} />
              <span style={{background: syntax().string, width: '34%'}} />
            </span>
            <span class="proto-theme-swatch-line">
              <span style={{background: syntax().comment, width: '56%'}} />
            </span>
          </span>
        </Match>
      </Switch>
    </span>
  );
}
