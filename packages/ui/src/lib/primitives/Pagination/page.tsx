import {ParentProps} from 'solid-js';
import {IconButton} from '../IconButton';
import {buttonPaginationProps} from './buttons';

const Page = (props: ParentProps<buttonPaginationProps>) => {
  return (
    <IconButton
      theme={props.selected ? 'primary' : 'secondary'}
      as="li"
      pill
      onClick={() => props.onClick?.(props.value)}
    >
      {props.value}
    </IconButton>
  );
};

export default Page;
