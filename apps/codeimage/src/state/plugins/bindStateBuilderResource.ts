import {
  ResourceFetcher,
  ResourceOptions,
  Setter,
  Signal,
  createResource,
} from 'solid-js';
import {GenericStoreApi, create} from 'statebuilder';

export function bindStateBuilderResource<T>(store: GenericStoreApi<T>) {
  return function (_: T | undefined): Signal<T | undefined> {
    return [
      () => store(),
      (v: T) => {
        const value = typeof v === 'function' ? v(store()) : v;
        store.set(value);
        return store;
      },
    ] as Signal<T | undefined>;
  };
}

export type Resource<T> = GenericStoreApi<T, Setter<T>>;

function makeResource<T>(
  resourceFetcher: () => ResourceFetcher<true, T, true>,
  options?: ResourceOptions<T, true>,
): Resource<T> {
  const [state, {mutate, refetch}] = createResource(
    resourceFetcher(),
    options ?? {},
  );

  Reflect.set(state, 'refetch', refetch);
  Reflect.set(state, 'set', mutate);

  return state as unknown as Resource<T>;
}

export const experimental__defineResource = create('resource', makeResource);
