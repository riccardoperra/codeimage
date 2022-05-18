import * as styles from './EditorSidebar.css';
import {Component} from 'solid-js';
import {Box} from '@codeimage/ui';

export const EditorForm: Component = props => (
  <Box class={styles.sidebar}>{props.children}</Box>
);
