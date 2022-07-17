import {from as rxjsFrom, map, type Observable, Subject} from 'rxjs';
import {
  Accessor,
  createEffect,
  createSignal,
  from,
  observable,
  on,
} from 'solid-js';
import {
  createStore as coreCreateStore,
  SetStoreFunction,
  unwrap,
} from 'solid-js/store';

export type StoreEvent = {
  type: string;
  value: unknown;
};

interface CreateStoreOptions<T> {
  middlewares?: readonly ((
    args: [state: Accessor<T | undefined>, setState: SetStoreFunction<T>],
  ) => unknown | Promise<unknown>)[];
}

export interface StoreInternals<T> {
  events$: Subject<StoreEvent>;
  $$setter: SetStoreFunction<T>;
  $$isStore: true;
}

export const $STORE = Symbol('store-internals');

export function createStore<T extends {}>(
  initialState: T,
  options: CreateStoreOptions<T> = {},
) {
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
  const [initialized, setInitialized] = createSignal(false);

  const setStore = (...args: Parameters<typeof internalSetStore>) => {
    const returnValue = internalSetStore(...args);
    setSignal(Symbol());
    return returnValue;
  };

  const signal$ = rxjsFrom(observable(signal) as unknown as Observable<symbol>);
  const state$ = signal$.pipe(map(() => unwrap(store)));

  const storeAccessor = from(state$);

  createEffect(
    on(initialized, initialized => {
      if (initialized) {
        events$.next({type: '$$INIT', value: unwrap(store)});
      }
    }),
  );

  createEffect(() => {
    if (options.middlewares) {
      const resolvedMiddlewares = options.middlewares.map(middleware => {
        const result = middleware([storeAccessor, internalSetStore]);
        return result instanceof Promise ? result : Promise.resolve(result);
      });
      Promise.all(resolvedMiddlewares).then(() => setInitialized(true));
    }
  });

  return [
    store,
    setStore,
    {
      initialized,
      state$,
      events$: events$.asObservable(),
    },
  ] as [
    typeof store,
    typeof internalSetStore,
    {
      initialized: Accessor<boolean>;
      events$: Observable<StoreEvent>;
      state$: Observable<T>;
    },
  ];
}
