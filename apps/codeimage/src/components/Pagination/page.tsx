import {IconButton} from '@codeimage/ui';
import {createEffect, ParentProps} from 'solid-js';
import {buttonPaginationProps} from './buttons';

const Page = (props: ParentProps<buttonPaginationProps>) => {
  console.log('page');
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
