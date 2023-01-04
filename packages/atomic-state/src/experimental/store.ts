import {Accessor} from 'solid-js';
import {SetStoreFunction} from 'solid-js/store';
import {createStore} from '../createStore';

export interface Store<T> {
  get: Accessor<T>;
  set: SetStoreFunction<T>;
  state: T;

  extend<Data>(mergeCb: (ctx: Store<T>) => Data): Store<T> & Data;
}

export function createExperimentalStore<TState extends object>(
  initialState: TState,
): Store<TState> {
  const [store, setStore] = createStore(initialState);

  return {
    get() {
      return store;
    },
    set: setStore,
    state: store,
    extend(ctx) {
      return Object.assign(this, ctx(this));
    },
  };
}
