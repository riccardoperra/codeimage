import {Accessor, createSignal, Setter} from 'solid-js';

export const createPagedData = <T>(
  data: Accessor<T[] | undefined>,
): [
  Accessor<T[]>,
  {page: Accessor<number>; setPage: Setter<number>; perPage: number},
] => {
  const [page, setPage] = createSignal(1),
    perPage = 9;

  const pagedData = () => {
    return data()?.slice(page() * perPage, page() * perPage + perPage) ?? [];
  };

  return [pagedData, {page, setPage, perPage}];
};
