import {Component} from 'solid-js';
import {Box} from '../Box/Box';
import * as styles from './Group.css';
import {GroupVariants} from './Group.css';

type GroupProps = GroupVariants & {};

export const Group: Component<GroupProps> = props => {
  return (
    <Box
      data-orientation={props.orientation}
      class={styles.group({
        orientation: props.orientation,
      })}
    >
      {props.children}
    </Box>
  );
};
