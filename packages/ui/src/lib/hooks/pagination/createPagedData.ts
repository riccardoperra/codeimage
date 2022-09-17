import {Accessor, createSignal, Setter} from 'solid-js';
interface OptionsPagedData {
  pageSize: number;
  pageSelected: number;
}

export const createPagedData = <T>(
  data: Accessor<T[] | undefined>,
  options: OptionsPagedData,
): [Accessor<T[]>, {page: Accessor<number>; setPage: Setter<number>}] => {
  const [page, setPage] = createSignal(options.pageSelected);
  const pageSize = () => options.pageSize;
  const pagedData = () => {
    const start = (page() - 1) * pageSize();
    const end = start + pageSize();
    return data()?.slice(start, end) ?? [];
  };

  return [pagedData, {page, setPage}];
};
