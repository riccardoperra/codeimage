import {FlowComponent} from 'solid-js';
import {Box} from '../Box';
import * as styles from './Group.css';
import {GroupVariants} from './Group.css';

type GroupProps = GroupVariants;

export const Group: FlowComponent<GroupProps> = props => {
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
