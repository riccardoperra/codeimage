import {Component, createMemo, onMount} from 'solid-js';
import * as styles from './Scaffold.css';
import clsx from 'clsx';
import {useUIState} from '../../state/ui';
import {lightThemeCss} from '../../theme/light-theme.css';
import {darkThemeCss} from '../../theme/dark-theme.css';
import {backgroundColorVar} from '../../theme/variables.css';
import {setElementVars} from '@vanilla-extract/dynamic';

export const Scaffold: Component = props => {
  const ui = useUIState();

  const theme = createMemo(() =>
    ui.themeMode === 'light' ? lightThemeCss : darkThemeCss,
  );

  onMount(() => {
    useUIState.subscribe(
      state => state.themeMode,
      theme => {
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
      },
      {fireImmediately: true},
    );
  });

  return <div class={clsx(styles.scaffold, theme())}>{props.children}</div>;
};
