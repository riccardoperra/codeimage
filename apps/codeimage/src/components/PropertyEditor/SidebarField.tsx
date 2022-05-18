import {ParentComponent} from 'solid-js';
import * as styles from './SidebarField.css';

export const SidebarField: ParentComponent = props => {
  return <div class={styles.wrapper}>{props.children}</div>;
};
