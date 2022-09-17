import {For, mergeProps, ParentProps, Setter} from 'solid-js';
import {Box} from '../Box';
import {IconButton} from '../IconButton';
import {createPaginationButtons} from './buttons';
import Page from './page';

export interface PaginationProps {
  pageNumber?: number;
  onChange: Setter<number>;
  lastPage?: number;
}

export const Pagination = (props: ParentProps<PaginationProps>) => {
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

  const handlerNextChange = () => {
    merged.onChange(prev => prev + 1);
  };

  const handlerPrevChange = () => {
    merged.onChange(prev => prev - 1);
  };

  return (
    <Box display="flex" flexDirection="column" placeItems="center">
      <Box display="flex" gap="2">
        <IconButton
          onClick={handlerNextChange}
          pill
          disabled={merged.pageNumber === 1}
        >
          {'<'}
        </IconButton>
        <For each={itemButtons()}>{page => <Page {...page} />}</For>
        <IconButton
          onclick={handlerPrevChange}
          pill
          disabled={merged.pageNumber === merged.lastPage}
        >
          {'>'}
        </IconButton>
      </Box>
    </Box>
  );
};
