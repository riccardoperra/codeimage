import {Accessor, createSignal, Setter, createEffect} from 'solid-js';

export const createPagedData = <T>(
  data: Accessor<T[] | undefined>,
): [
  Accessor<T[]>,
  {page: Accessor<number>; setPage: Setter<number>; pageSize: number},
] => {
  const [page, setPage] = createSignal(1),
    pageSize = 9;
  createEffect(() =>
    console.log('page', {
      start: (page() - 1) * pageSize,
      end: (page() - 1) * pageSize + pageSize,
    }),
  );
  const pagedData = () => {
    const start = (page() - 1) * pageSize;
    const end = start + pageSize;
    return data()?.slice(start, end) ?? [];
  };

  return [pagedData, {page, setPage, pageSize}];
};
