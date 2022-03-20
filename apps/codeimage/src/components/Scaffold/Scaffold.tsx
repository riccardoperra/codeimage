import {Component, createEffect, createMemo, on} from 'solid-js';
import * as styles from './Scaffold.css';
import clsx from 'clsx';
import {lightThemeCss} from '../../theme/light-theme.css';
import {darkThemeCss} from '../../theme/dark-theme.css';
import {backgroundColorVar} from '../../theme/variables.css';
import {assignInlineVars, setElementVars} from '@vanilla-extract/dynamic';
import {dynamicFullHeight} from '../../theme/base.css';
import {uiStore} from '../../state/ui';

export const Scaffold: Component = props => {
  const mode = () => uiStore.themeMode;

  const theme = createMemo(() =>
    mode() === 'light' ? lightThemeCss : darkThemeCss,
  );

  createEffect(
    on(mode, theme => {
      const scheme = document.querySelector('meta[name="theme-color"]');
      const body = document.body;
      if (scheme) {
        // TODO: add palette
        const color = theme === 'dark' ? '#111111' : '#FFFFFF';
        scheme.setAttribute('content', color);
        setElementVars(body, {
          [backgroundColorVar]: color,
        });
      }
    }),
  );

  return (
    <div
      class={clsx(styles.scaffold, theme())}
      style={assignInlineVars({
        [dynamicFullHeight]: `${window.innerHeight * 0.01}px`,
      })}
    >
      {props.children}
    </div>
  );
};
