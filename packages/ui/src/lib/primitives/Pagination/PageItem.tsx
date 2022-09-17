import {ParentProps} from 'solid-js';
import {IconButton} from '../IconButton';
import {buttonPaginationProps} from './buttons';
import * as styles from './PageItem.css';

const PageItem = (props: ParentProps<buttonPaginationProps>) => {
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
