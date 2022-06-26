import {dynamicFullHeight} from '@codeimage/ui';
import {createPlatformProps} from '@core/hooks/createPlatformProps';
import {
  isAndroid,
  isChrome,
  isFirefox,
  isIOS,
} from '@solid-primitives/platform';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import {ParentComponent} from 'solid-js';
import * as styles from './Scaffold.css';

export const Scaffold: ParentComponent = props => {
  return (
    <div
      id={'app-scaffold'}
      {...createPlatformProps()}
      class={clsx(styles.scaffold)}
      style={assignInlineVars({
        [dynamicFullHeight]: `${window.innerHeight * 0.01}px`,
      })}
    >
      {props.children}
    </div>
  );
};
