import clsx from 'clsx';
import type {FlowComponent} from 'solid-js';
import type {CustomComponentProps} from '../../utils';
import {styled} from '../../utils';
import * as styles from './Group.css';
import type {GroupVariants} from './Group.css';

type GroupProps = CustomComponentProps<'div', GroupVariants>;

export const Group: FlowComponent<GroupProps> = props => {
  const classes = () =>
    clsx(
      styles.group({
        orientation: props.orientation,
      }),
      props.class,
    );

  return (
    <styled.div {...props} data-orientation={props} class={classes()}>
      {props.children}
    </styled.div>
  );
};
