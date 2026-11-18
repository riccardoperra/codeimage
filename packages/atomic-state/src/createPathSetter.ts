import {storePath} from '@solidjs/signals';
import type {StoreSetter} from 'solid-js';
import type {SetStoreFunction} from './experimental/store-types';

export function createPathSetter<T>(set: StoreSetter<T>): SetStoreFunction<T> {
  const update = storePath as (...args: unknown[]) => (draft: T) => void;
  return (...args: unknown[]) => {
    set(draft => {
      if (!Array.isArray(draft) || args.length !== 1) {
        update(...args)(draft);
        return;
      }
      const [value] = args;
      const next = typeof value === 'function' ? value(draft) : value;
      if (next === draft) return;
      if (Array.isArray(next)) draft.splice(0, draft.length, ...next);
      else update(next)(draft);
    });
  };
}
