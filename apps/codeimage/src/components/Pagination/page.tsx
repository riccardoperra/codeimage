import {Box} from '@codeimage/ui';
import {ParentProps} from 'solid-js';

const Page = (
  props: ParentProps<{
    onChange: (value: number) => void;
    value: number;
    active: boolean;
  }>,
) => {
  return (
    <Box
      style={{
        border: props.active ? '1px solid gray' : '',
      }}
      onClick={() => props.onChange(props.value)}
      padding={2}
      cursor="pointer"
      borderRadius="full"
    >
      {props.value === 0 ? '...' : props.value}
    </Box>
  );
};

export default Page;
