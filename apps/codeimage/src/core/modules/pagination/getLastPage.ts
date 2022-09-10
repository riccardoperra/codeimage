import {Accessor} from 'solid-js';

export const getLastPage = <T>(data: Accessor<T[]>, perPage: number) => {
  const last = Math.floor(data().length / perPage);
  return last === 0 ? 1 : last;
};
