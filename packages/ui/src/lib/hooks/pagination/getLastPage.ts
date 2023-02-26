import {Accessor} from 'solid-js';
/**
 * Util to get last Page of our pagination
 * @param data Accessor with all data not paginated
 * @param pageSize Accessor with number of elements we want per page
 * @returns number with the last page of our pagination
 *
 * @example
 *
 * getLastPate(dashboard.filteredData, dashboard.pageSize)
 */
export const getLastPage = <T>(
  data: Accessor<T[]>,
  pageSize: Accessor<number>,
) => {
  const last = Math.ceil(data().length / pageSize());
  return last === 0 ? 1 : last;
};
