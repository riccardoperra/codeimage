import {from as rxjsFrom, map, type Observable, Subject} from 'rxjs';
import {createSignal, from, observable} from 'solid-js';
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

export function createStore<T>(initialState: T) {
  const events$ = new Subject<StoreEvent>();
  const [store, internalSetStore] = coreCreateStore<T>(
    Object.assign(initialState, {
      ...initialState,
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
    }),
  );
  const [signal, setSignal] = createSignal<symbol>();

  const setStore = (...args: Parameters<typeof internalSetStore>) => {
    const returnValue = internalSetStore(...args);
    setSignal(Symbol());
    return returnValue;
  };

  const signal$ = rxjsFrom(observable(signal) as unknown as Observable<symbol>);
  const state$ = signal$.pipe(map(() => unwrap(store)));

  const storeAccessor = from(state$);

  const storeWithAccessor = Object.assign(store, {
    accessor() {
      return storeAccessor();
    },
  });

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
