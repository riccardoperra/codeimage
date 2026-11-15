import {assignInlineVars} from '@vanilla-extract/dynamic';
import {Match, Switch} from 'solid-js';
import type {ThemeEntry} from './model';
import {themeStyle, themeStyleEntry} from './theme-styles/style';
import * as styles from './theme-swatch.css';

export const SWATCH_VARIANTS = ['syntax-orb', 'aa', 'window'] as const;

export type SwatchVariant = (typeof SWATCH_VARIANTS)[number];

interface ThemeSwatchProps {
  theme: ThemeEntry;
  /** Height in px, and the diameter of the round styles. Defaults to 56. */
  size?: number;
  /** Width in px of `window`, or `fill` for the width of the parent. Defaults to `size`. */
  width?: number | 'fill';
  /** Defaults to the mark of the theme style chosen in the harness (the `t` URL parameter). */
  variant?: SwatchVariant;
}

/**
 * One theme as a small mark, in one of several styles:
 * - `syntax-orb`: soft blobs of the keyword, string and function colours on the window colour.
 * - `aa`: "Aa" in the keyword and string colours on the window colour.
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

  const vars = () => {
    const v = styles.swatchVars;
    return assignInlineVars({
      [v.size]: `${size()}px`,
      [v.width]: width() === 'fill' ? '100%' : `${width()}px`,
      [v.frame]: props.theme.colors.background,
      [v.window]: props.theme.colors.window,
      [v.text]: props.theme.colors.text,
      [v.base]: syntax().base,
      [v.keyword]: syntax().keyword,
      [v.string]: syntax().string,
      [v.function]: syntax().function,
      [v.number]: syntax().number,
      [v.type]: syntax().type,
      [v.property]: syntax().property,
      [v.comment]: syntax().comment,
    });
  };

  const line = (options: {indent?: boolean; long?: boolean} = {}) =>
    styles.line({...options, wide: wide()});
  const bar = () => styles.bar({wide: wide()});

  return (
    <span
      class={styles.swatch({variant: variant(), wide: wide()})}
      data-variant={variant()}
      aria-hidden="true"
      style={vars()}
    >
      <Switch>
        <Match when={variant() === 'syntax-orb'}>
          <span class={styles.blob({token: 'keyword'})} />
          <span class={styles.blob({token: 'string'})} />
          <span class={styles.blob({token: 'function'})} />
        </Match>
        <Match when={variant() === 'aa'}>
          <span class={styles.aa}>
            <span style={{color: syntax().keyword}}>A</span>
            <span style={{color: syntax().string}}>a</span>
          </span>
        </Match>
        <Match when={variant() === 'window'}>
          <span class={styles.editor({wide: wide()})}>
            <span class={styles.header({wide: wide()})}>
              <span class={styles.dot} />
              <span class={styles.dot} />
              <span class={styles.dot} />
            </span>
            <span class={line()}>
              <span
                class={bar()}
                style={{background: syntax().keyword, width: '24%'}}
              />
              <span
                class={bar()}
                style={{background: syntax().function, width: '38%'}}
              />
            </span>
            <span class={line({indent: true})}>
              <span
                class={bar()}
                style={{background: syntax().property, width: '28%'}}
              />
              <span
                class={bar()}
                style={{background: syntax().string, width: '34%'}}
              />
            </span>
            <span class={line({indent: true, long: true})}>
              <span
                class={bar()}
                style={{background: syntax().function, width: '30%'}}
              />
              <span
                class={bar()}
                style={{background: syntax().number, width: '12%'}}
              />
            </span>
            <span class={line({long: true})}>
              <span
                class={bar()}
                style={{background: syntax().comment, width: '56%'}}
              />
            </span>
            <span class={line({long: true})}>
              <span
                class={bar()}
                style={{background: syntax().type, width: '18%'}}
              />
              <span
                class={bar()}
                style={{background: syntax().base, width: '10%'}}
              />
            </span>
          </span>
        </Match>
      </Switch>
    </span>
  );
}
