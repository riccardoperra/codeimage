import {For, mergeProps, ParentProps, Setter} from 'solid-js';
import {SvgIcon, SvgIconProps} from '../Icon';
import {IconButton} from '../IconButton';
import {createPaginationButtons} from './createPaginationButtons';
import PageItem from './PageItem';
import * as styles from './Pagination.css';

export interface PaginationProps {
  pageNumber?: number;
  onChange: Setter<number>;
  lastPage?: number;
}

function NextIcon(props: SvgIconProps) {
  return (
    <SvgIcon
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </SvgIcon>
  );
}

function PrevIcon(props: SvgIconProps) {
  return (
    <SvgIcon
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </SvgIcon>
  );
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

  const isPrevDisabled = () => merged.pageNumber === 1;
  const isNextDisabled = () => merged.pageNumber === merged.lastPage;

  const handlerNextChange = () => merged.onChange(prev => prev + 1);
  const handlerPrevChange = () => merged.onChange(prev => prev - 1);

  return (
    <div class={styles.pagination}>
      <IconButton pill disabled={isPrevDisabled()} onClick={handlerPrevChange}>
        <PrevIcon />
      </IconButton>
      <For each={itemButtons()}>
        {pageItemProps => <PageItem {...pageItemProps} />}
      </For>
      <IconButton pill disabled={isNextDisabled()} onClick={handlerNextChange}>
        <NextIcon />
      </IconButton>
    </div>
  );
};
