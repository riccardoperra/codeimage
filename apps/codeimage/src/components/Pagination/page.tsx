import {IconButton} from '@codeimage/ui';
import {ParentProps} from 'solid-js';

const Page = (
  props: ParentProps<{
    onChange: (value: number) => void;
    value: number | string;
    active: boolean;
    rigenerate: boolean;
  }>,
) => {
  return (
    <IconButton
      style={{
        border: props.active ? '1px solid gray' : '',
      }}
      onClick={() => props.onChange(props.value as number)}
      disabled={props.value === '...'}
    >
      {props.value}
    </IconButton>
  );
};

export default Page;
