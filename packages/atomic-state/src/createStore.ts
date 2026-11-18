import {type Observable, Subject} from 'rxjs';
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

export function createStore<T extends object>(
  initialState: T,
): [
  T & {accessor: Accessor<T>},
  SetStoreFunction<T>,
  {events$: Observable<StoreEvent>; state$: Observable<T>},
] {
  const events$ = new Subject<StoreEvent>();
  const [store, internalSetStore] = coreCreateStore<T>(
    Object.assign(initialState, {
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
      accessor() {
        return storeAccessor();
      },
    }),
  );
  const [signal, setSignal] = createSignal<symbol>();

  const setStore = createPathSetter<T>(callback => {
    internalSetStore(callback);
    setSignal(Symbol());
  });

  const state$ = createObservable(() => {
    signal();
    return snapshot(store);
  });

  const storeAccessor = () => {
    signal();
    return store;
  };

  const storeWithAccessor = store as T & {
    accessor: Accessor<T>;
  };

  return [
    storeWithAccessor,
    setStore,
    {
      state$,
      events$: events$.asObservable(),
    },
  ];
}
