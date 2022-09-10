import {IconButton} from '@codeimage/ui';
import {createEffect, ParentProps} from 'solid-js';
import {buttonPaginationProps} from './buttons';

const Page = (props: ParentProps<buttonPaginationProps>) => {
  createEffect(() =>
    console.log('Page', {valore: props.value, selected: props.selected}),
  );
  return (
    <IconButton
      style={{
        border: props.selected ? '1px solid gray' : '',
      }}
      onClick={() => props.onClick(props.value as number)}
    >
      {props.value}
    </IconButton>
  );
};

export default Page;
