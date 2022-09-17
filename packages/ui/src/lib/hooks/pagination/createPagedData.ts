import {Accessor, createSignal, Setter} from 'solid-js';
interface pagedDataOptions {
  pageSize: Accessor<number>;
  pageSelected: number;
}

export const createPagedData = <T>(
  data: Accessor<T[] | undefined>,
  options: pagedDataOptions,
): [Accessor<T[]>, {page: Accessor<number>; setPage: Setter<number>}] => {
  const [page, setPage] = createSignal(options.pageSelected);
  const pagedData = () => {
    const start = (page() - 1) * options.pageSize();
    const end = start + options.pageSize();
    return data()?.slice(start, end) ?? [];
  };

  return [pagedData, {page, setPage}];
};
