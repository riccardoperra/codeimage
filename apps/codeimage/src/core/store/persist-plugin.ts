import {reconcile, SetStoreFunction, Store} from 'solid-js/store';
import {SolidStorePlugin} from './create-pluggable-store';

interface Options {
  name: string;
}

interface Extra {
  clearStorage(): void;
}

export function withLocalStorage<S>(options: Options): SolidStorePlugin<
  S,
  {
    storage: Extra;
  }
> {
  return <TState extends S>(
    get: Store<TState>,
    set: SetStoreFunction<TState>,
  ) => {
    const defaultSet = set;

    const initialState = localStorage.getItem(options.name);
    if (initialState) {
      try {
        const parsedState = JSON.parse(initialState);
        set(reconcile(parsedState));
      } catch {}
    }

    set = (...args: unknown[]): ReturnType<SetStoreFunction<S>> => {
      const result = defaultSet(
        ...(args as Parameters<SetStoreFunction<TState>>),
      );
      localStorage.setItem(options.name, JSON.stringify(get));
      return result;
    };

    const clearStorage = () => {
      localStorage.removeItem(options.name);
    };

    return [
      get,
      set,
      {
        storage: {
          clearStorage,
        },
      },
    ];
  };
}
