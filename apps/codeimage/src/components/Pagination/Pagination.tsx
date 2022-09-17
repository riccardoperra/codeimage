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

  const handleChange = (direction: 'next' | 'prev') => () =>
    merged.onChange(prev => (direction === 'next' ? prev + 1 : prev - 1));

  return (
    <Box display={'flex'} flexDirection="column" placeItems="center">
      <Box display={'flex'} gap={2}>
        <IconButton
          onClick={handleChange('prev')}
          pill
          disabled={merged.pageNumber === 1}
        >
          {'<'}
        </IconButton>
        <For each={itemButtons()}>{page => <Page {...page} />}</For>
        <IconButton
          onclick={handleChange('next')}
          pill
          disabled={merged.pageNumber === merged.lastPage}
        >
          {'>'}
        </IconButton>
      </Box>
    </Box>
  );
};

export default Pagination;
