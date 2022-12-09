import * as styles from './Toggle.css';
import {ToggleProps as ShToggleProps} from 'solid-headless';
import {Toggle as ShToggle} from 'solid-headless';
import {Component} from 'solid-js';

type ToggleProps = ShToggleProps & styles.ToggleVariants;

export const Toggle: Component<ToggleProps> = props => {
  return (
    <ShToggle
      {...props}
      class={`${styles.variant({
        theme: props.theme,
        variant: props.variant,
      })} ${props.class || ''}`}
    />
  );
};
