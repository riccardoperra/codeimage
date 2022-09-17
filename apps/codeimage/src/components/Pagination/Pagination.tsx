import {Box, IconButton} from '@codeimage/ui';
import {For, mergeProps, ParentProps, Setter} from 'solid-js';
import {createPaginationButtons} from './buttons';
import Page from './page';

export interface PaginationProps {
  pageNumber?: number;
  onChange: Setter<number>;
  lastPage?: number;
}

const Pagination = (props: ParentProps<PaginationProps>) => {
  const merged = mergeProps(
    {pageNumber: 1, lastPage: 1} as Required<PaginationProps>,
    props,
  );
  const itemButtons = createPaginationButtons(
    () => merged.lastPage,
    () => merged.pageNumber,
    page => props.onChange(page),
    false,
  );
  return (
    <Box
      display={'flex'}
      flexDirection="column"
      style={{color: 'white'}}
      placeItems="center"
    >
      <Box display={'flex'} gap={2}>
        <IconButton onClick={() => console.log('prev')}>{'<'}</IconButton>
        <For each={itemButtons()}>{page => <Page {...page} />}</For>
        <IconButton onclick={() => console.log('next')}>{'>'}</IconButton>
      </Box>
    </Box>
  );
};

export default Pagination;
