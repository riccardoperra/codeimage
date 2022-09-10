import {Accessor} from 'solid-js';

export const min = (start: Accessor<number>, end: Accessor<number>) => {
  return Math.min(start(), end());
};
