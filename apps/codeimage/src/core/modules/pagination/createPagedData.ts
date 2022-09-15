import {Accessor, createSignal, Setter} from 'solid-js';
interface CreatePaginatedProps<T> {
  data: Accessor<T[] | undefined>;
  options: {pageSize: number; pageSelected: number};
}

export const createPagedData = <T>({
  data,
  options,
}: CreatePaginatedProps<T>): [
  Accessor<T[]>,
  {page: Accessor<number>; setPage: Setter<number>},
] => {
  console.log('pageSelected', options.pageSelected);
  const [page, setPage] = createSignal(options.pageSelected);
  const pagedData = () => {
    const start = (page() - 1) * options.pageSize;
    const end = start + options.pageSize;
    return data()?.slice(start, end) ?? [];
  };

  return [pagedData, {page, setPage}];
};
