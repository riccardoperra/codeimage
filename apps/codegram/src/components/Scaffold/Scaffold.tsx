import {Component} from 'solid-js';
import * as styles from './Scaffold.css';
import clsx from 'clsx';

interface ScaffoldProps {
  theme: string;
}

export const Scaffold: Component<ScaffoldProps> = props => {
  return <div class={clsx(styles.scaffold, props.theme)}>{props.children}</div>;
};
