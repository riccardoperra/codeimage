import {Store} from 'solid-js/store';
import {$STORE, StoreInternals} from './createStore';
/**
 * @internal
 */
export function getStoreInternals<T extends object>(store: Store<T>) {
  const {$$isStore, $$setter, events$} = (
    store as T & {
      [$STORE]: StoreInternals<T>;
    }
  )[$STORE];

  if (!$$isStore) {
    throw new Error('Given parameter is not a given store.');
  }

  return {
    $$setter,
    events$,
  };
}
