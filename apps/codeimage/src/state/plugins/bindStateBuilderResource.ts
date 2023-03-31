import {Signal} from 'solid-js';
import {GenericStoreApi} from 'statebuilder';

export function bindStateBuilderResource<T>(store: GenericStoreApi<T>) {
  return function (_: T | undefined): Signal<T | undefined> {
    return [
      () => store(),
      (v: T) => {
        const value = typeof v === 'function' ? v(store()) : v;
        store.set(value);
        return store;
      },
    ] as Signal<T | undefined>;
  };
}
