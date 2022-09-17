import {ParentProps} from 'solid-js';
import {IconButton} from '../IconButton';
import {ButtonPaginationProps} from './createPaginationButtons';
import * as styles from './PageItem.css';

const PageItem = (props: ParentProps<ButtonPaginationProps>) => {
  return (
    <IconButton
      theme={props.selected ? 'primary' : 'secondary'}
      as="li"
      pill
      class={styles.pageItemButton}
      onClick={() => props.onClick?.(props.value)}
    >
      {props.value}
    </IconButton>
  );
};

export default PageItem;
