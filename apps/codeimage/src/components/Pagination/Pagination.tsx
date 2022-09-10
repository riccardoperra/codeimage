import {Box, IconButton} from '@codeimage/ui';
import {createEffect, For, mergeProps, ParentProps, Setter} from 'solid-js';
import {usePaginationButtons} from './buttons';
import Page from './page';

export interface PaginationProps {
  /**
   * The current value (controlled).
   */
  value?: number;
  /**
   * Handler that is called when the value changes.
   */
  onChange: Setter<number>;
  maxValue?: number;
}

const Pagination = (props: ParentProps<PaginationProps>) => {
  const merged = mergeProps(
    {value: 1, maxValue: 1} as Required<PaginationProps>,
    props,
  );
  createEffect(() =>
    console.log('Props Pagination', {
      value: merged.value,
      max: merged.maxValue,
    }),
  );
  const itemButtons = usePaginationButtons(
    () => merged.maxValue,
    () => merged.value,
    () => props.onChange,
    false,
  );
  console.log('buttons ITEMS', itemButtons);
  return (
    <Box display={'flex'} flexDirection="column" style={{color: 'white'}}>
      <Box display={'flex'} gap={2}>
        <IconButton onClick={() => console.log('prev')}>{'<'}</IconButton>
        <For each={itemButtons}>{page => <Page {...page} />}</For>
        <IconButton onclick={() => console.log('next')}>{'>'}</IconButton>
      </Box>
    </Box>
  );
};

export default Pagination;
