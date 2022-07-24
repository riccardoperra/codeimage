import {Store} from 'solid-js/store';
import {$STORE, StoreInternals} from './createStore';

export function getStoreInternals<T extends object>(
  store: Store<T>,
): StoreInternals<T> {
  const internals = (
    store as T & {
      [$STORE]: StoreInternals<T>;
    }
  )[$STORE];

  if (!internals.$$isStore) {
    throw new Error('Given parameter is not a store.');
  }

  return internals;
}
