import {createSignal} from 'solid-js';
import {createStore} from 'solid-js/store';

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

  return [store, setStore, signal] as [typeof store, typeof internalSetStore, typeof signal];
};

export default makeStore;
