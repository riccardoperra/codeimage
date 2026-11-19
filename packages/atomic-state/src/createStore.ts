import type {NoFn} from '@solidjs/signals';
import {
  createSignal,
  createStore as coreCreateStore,
  snapshot,
  type Accessor,
} from 'solid-js';
import {createPathSetter} from './createPathSetter';
import type {SetStoreFunction} from './experimental/store-types';

export interface StoreInternals<T> {
  $$setter: SetStoreFunction<T>;
  $$isStore: true;
}

export const $STORE = Symbol('store-internals');

type StoreSeed<T> = T & {
  readonly [$STORE]: StoreInternals<T>;
  accessor: Accessor<T>;
};

function isStoreSeed<T extends object>(value: T): value is T & NoFn<T> {
  return typeof value !== 'function';
}

export function createStore<T extends object>(
  initialState: T,
): [T & {accessor: Accessor<T>}, SetStoreFunction<T>, {snapshot: Accessor<T>}] {
  const seed: StoreSeed<T> = Object.assign(initialState, {
    get [$STORE](): StoreInternals<T> {
      return {
        get $$setter() {
          return setStore;
        },
        $$isStore: true,
      };
    },
    accessor(): T {
      return storeAccessor();
    },
  });
  if (!isStoreSeed(seed)) throw new TypeError('Expected an object store seed');
  const [store, internalSetStore] = coreCreateStore<StoreSeed<T>>(seed);
  const [signal, setSignal] = createSignal<symbol>();

  const setStore = createPathSetter<T>(callback => {
    internalSetStore(callback);
    setSignal(Symbol());
  });

  const storeAccessor = (): T => {
    signal();
    return store;
  };

  return [store, setStore, {snapshot: () => snapshot(storeAccessor())}];
}
