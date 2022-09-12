import {Box, IconButton} from '@codeimage/ui';
import {For, mergeProps, ParentProps, Setter} from 'solid-js';
import {createPaginationButtons} from './buttons';
import Page from './page';

export interface PaginationProps {
  pageNumber?: number;
  /**
   * Handler that is called when the value changes.
   */
  onChange: Setter<number>;
  pageSize?: number;
}

const Pagination = (props: ParentProps<PaginationProps>) => {
  const merged = mergeProps(
    {pageNumber: 1, pageSize: 1} as Required<PaginationProps>,
    props,
  );
  const itemButtons = createPaginationButtons(
    () => merged.pageSize,
    () => merged.pageNumber,
    page => props.onChange(page),
    false,
  );
  return (
    <Box display={'flex'} flexDirection="column" style={{color: 'white'}}>
      <Box display={'flex'} gap={2}>
        <IconButton onClick={() => console.log('prev')}>{'<'}</IconButton>
        <For each={itemButtons()}>{page => <Page {...page} />}</For>
        <IconButton onclick={() => console.log('next')}>{'>'}</IconButton>
      </Box>
    </Box>
  );
};

export default Pagination;
