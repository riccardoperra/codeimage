import {from, map, Observable, shareReplay} from 'rxjs';
import {createSignal, observable} from 'solid-js';
import {createStore, unwrap} from 'solid-js/store';

export const makeStore = <T>(
  ...args: Parameters<typeof createStore<T>>
) => {
  const [store, internalSetStore] = createStore<T>(...args);
  const [signal, setSignal] = createSignal<symbol>();

  const setStore = (...args: Parameters<typeof internalSetStore>) => {
    const returnValue = internalSetStore(...args);
    setSignal(Symbol());
    return returnValue;
  };

  // eslint-disable-next-line solid/reactivity
  const signal$ = observable(signal) as unknown as Observable<symbol>;

  const state$: Observable<T> = from(signal$).pipe(
    map(() => unwrap(store)),
    shareReplay({refCount: true, bufferSize: 1})
  );

  return [
    store,
    setStore,
    {
      state$
    }
  ] as [
    typeof store,
    typeof internalSetStore,
    {state$: Observable<T>}
  ];
};

export default makeStore;
