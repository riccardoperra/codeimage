import {Box} from '@codeimage/ui';
import {ParentComponent} from 'solid-js';
import * as styles from './EditorSidebar.css';

export const EditorForm: ParentComponent = props => (
  <Box class={styles.sidebar}>{props.children}</Box>
);
