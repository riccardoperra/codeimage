import {from as rxjsFrom, map, type Observable, Subject} from 'rxjs';
import {Accessor, createSignal, from, observable} from 'solid-js';
import {
  createStore as coreCreateStore,
  SetStoreFunction,
  unwrap,
} from 'solid-js/store';

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

export function createStore<T extends object>(initialState: T) {
  const events$ = new Subject<StoreEvent>();
  const [store, internalSetStore] = coreCreateStore<T>(
    Object.assign(initialState, {
      get [$STORE](): StoreInternals<T> {
        return {
          get events$() {
            return events$;
          },
          get $$setter() {
            return internalSetStore;
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

  const setStore = (...args: Parameters<typeof internalSetStore>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const returnValue = (internalSetStore as any)(...args);
    setSignal(Symbol());
    return returnValue;
  };

  const signal$ = rxjsFrom(observable(signal));
  const state$ = signal$.pipe(map(() => unwrap(store)));

  const storeAccessor = from(state$);

  const storeWithAccessor = store as typeof store & {
    accessor: Accessor<T>;
  };

  return [
    storeWithAccessor,
    setStore,
    {
      state$,
      events$: events$.asObservable(),
    },
  ] as [
    typeof storeWithAccessor,
    typeof internalSetStore,
    {
      events$: Observable<StoreEvent>;
      state$: Observable<T>;
    },
  ];
}
