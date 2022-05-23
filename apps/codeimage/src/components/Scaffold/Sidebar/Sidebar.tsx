import {Box} from '@codeimage/ui';
import {ParentComponent} from 'solid-js';
import * as styles from './Sidebar.css';
import {SidebarVariants} from './Sidebar.css';

export const Sidebar: ParentComponent<SidebarVariants> = props => {
  return (
    <Box
      class={styles.sidebar({
        position: props.position,
      })}
    >
      {props.children}
    </Box>
  );
};
