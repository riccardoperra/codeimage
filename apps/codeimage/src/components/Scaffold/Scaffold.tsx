import {backgroundColorVar, dynamicFullHeight} from '@codeimage/ui';
import {assignInlineVars, setElementVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import {createEffect, on, ParentComponent} from 'solid-js';
import {uiStore} from '../../state/ui';
import {darkGrayScale, darkThemeCss} from '../../theme/dark-theme.css';
import {lightThemeCss} from '../../theme/light-theme.css';
import * as styles from './Scaffold.css';

export const Scaffold: ParentComponent = props => {
  const mode = () => uiStore.themeMode;
  const theme = () => (mode() === 'light' ? lightThemeCss : darkThemeCss);

  createEffect(
    on(mode, theme => {
      const scheme = document.querySelector('meta[name="theme-color"]');
      const body = document.body;
      if (scheme) {
        const color = theme === 'dark' ? darkGrayScale.gray1 : '#FFFFFF';
        scheme.setAttribute('content', color);
        setElementVars(body, {
          [backgroundColorVar]: color,
        });
      }
    }),
  );

  return (
    <div
      id={'app-scaffold'}
      class={clsx(styles.scaffold, theme())}
      style={assignInlineVars({
        [dynamicFullHeight]: `${window.innerHeight * 0.01}px`,
      })}
    >
      {props.children}
    </div>
  );
};
