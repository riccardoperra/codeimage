import {Accessor} from 'solid-js';
import {SetStoreFunction} from 'solid-js/store';
import {createStore} from '../createStore';

export interface Store<T> {
  get: Accessor<T>;
  set: SetStoreFunction<T>;
  state: T;

  with<Data>(mergeCb: (ctx: this) => Data): Store<T> & Data;
}

export function createExperimentalStore<TState extends object>(
  initialState: TState,
): Store<TState> {
  const [store, setStore] = createStore(initialState);

  return {
    get: store.accessor,
    set: setStore,
    state: store,
    with(ctx) {
      return Object.assign(this, ctx(this));
    },
  };
}
