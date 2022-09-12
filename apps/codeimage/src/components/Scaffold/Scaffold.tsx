import {dynamicFullHeight} from '@codeimage/ui';
import {createPlatformProps} from '@core/hooks/createPlatformProps';
import {createWindowSize} from '@solid-primitives/resize-observer';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import clsx from 'clsx';
import {ParentComponent} from 'solid-js';
import * as styles from './Scaffold.css';

export const Scaffold: ParentComponent = props => {
  const size = createWindowSize();

  return (
    <div
      id={'app-scaffold'}
      {...createPlatformProps()}
      class={clsx(styles.scaffold)}
      style={assignInlineVars({
        [dynamicFullHeight]: `${size.height * 0.01}px`,
      })}
    >
      {props.children}
    </div>
  );
};
