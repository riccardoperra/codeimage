import {Box} from '@codeimage/ui';
import {type ParentComponent} from 'solid-js';
import * as styles from './Sidebar.css';
import {type SidebarVariants} from './Sidebar.css';

export const Sidebar: ParentComponent<SidebarVariants> = props => {
  return (
    <Box
      class={styles.sidebar({
        position: props.position ?? 'none',
      })}
    >
      {props.children}
    </Box>
  );
};
