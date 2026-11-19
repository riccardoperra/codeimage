import {type Observable, Subject} from 'rxjs';
import type {NoFn} from '@solidjs/signals';
import {
  createSignal,
  createStore as coreCreateStore,
  snapshot,
  type Accessor,
} from 'solid-js';
import {createObservable} from './createObservable';
import {createPathSetter} from './createPathSetter';
import type {SetStoreFunction} from './experimental/store-types';

export type StoreEvent = {
  type: string;
  value: unknown;
};

export interface StoreInternals<T> {
  events$: Subject<StoreEvent>;
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
): [
  T & {accessor: Accessor<T>},
  SetStoreFunction<T>,
  {events$: Observable<StoreEvent>; state$: Observable<T>},
] {
  const events$ = new Subject<StoreEvent>();
  const seed: StoreSeed<T> = Object.assign(initialState, {
    get [$STORE](): StoreInternals<T> {
      return {
        get events$() {
          return events$;
        },
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

  const state$ = createObservable(() => {
    signal();
    return snapshot(store);
  });

  const storeAccessor = (): T => {
    signal();
    return store;
  };

  return [
    store,
    setStore,
    {
      state$,
      events$: events$.asObservable(),
    },
  ];
}
