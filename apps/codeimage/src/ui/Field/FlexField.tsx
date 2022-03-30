import * as styles from './FlexField.css';
import {Component} from 'solid-js';

export type FlexFieldProps = styles.FlexFieldVariants;

export const FlexField: Component<FlexFieldProps> = props => {
  return <div class={styles.wrapper({size: props.size})}>{props.children}</div>;
};
