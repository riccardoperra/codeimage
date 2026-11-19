import type {ContainerPluginContext, Store} from 'statebuilder';

export function readLocalState<T extends object>(
  storeName: string,
  defaults: T,
): T {
  if (typeof localStorage === 'undefined') return {...defaults};
  try {
    const initialState = localStorage.getItem(storeName);
    if (initialState) {
      const parsed: unknown = JSON.parse(initialState);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {...defaults, ...parsed};
      }
    }
  } catch {}
  return {...defaults};
}

export function withLocalStorage<T extends object>(storeName: string) {
  return (_store: Store<T>, context: ContainerPluginContext<Store<T>>) => {
    if (typeof localStorage === 'undefined') return;
    context.onSet(value =>
      localStorage.setItem(storeName, JSON.stringify(value)),
    );
  };
}
