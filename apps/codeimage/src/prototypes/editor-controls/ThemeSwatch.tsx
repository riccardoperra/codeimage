import type {JSX} from 'solid-js';
import {Match, Switch} from 'solid-js';
import type {ThemeEntry} from './model';
import './theme-swatch.css';

export const SWATCH_VARIANTS = [
  'orb',
  'syntax-orb',
  'aa',
  'palette',
  'window',
] as const;

export type SwatchVariant = (typeof SWATCH_VARIANTS)[number];

function isSwatchVariant(value: string | null): value is SwatchVariant {
  return SWATCH_VARIANTS.some(variant => variant === value);
}

/** The `t` URL parameter, so `?t=aa` restyles every swatch that sets no `variant`. */
export function swatchVariantFromUrl(): SwatchVariant {
  const requested = new URLSearchParams(location.search).get('t');
  return isSwatchVariant(requested) ? requested : 'orb';
}

interface ThemeSwatchProps {
  theme: ThemeEntry;
  /** Height in px, and the diameter of the round styles. Defaults to 56. */
  size?: number;
  /** Width in px of `palette` and `window`. Defaults to `size`. */
  width?: number;
  /** Defaults to the `t` URL parameter, then to `orb`. */
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
  const variant = () => props.variant ?? swatchVariantFromUrl();
  const size = () => props.size ?? 56;
  const width = () => props.width ?? size();
  const syntax = () => props.theme.colors.syntax;
  const wide = () => width() >= size() * 1.6;

  const style = (): JSX.CSSProperties => ({
    '--swatch-size': `${size()}px`,
    '--swatch-width': `${width()}px`,
    '--swatch-dot': `${wide() ? Math.min(size() * 0.26, width() / 9) : size() * 0.18}px`,
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
