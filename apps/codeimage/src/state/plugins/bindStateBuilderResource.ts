import {
  createResource,
  ResourceFetcher,
  ResourceOptions,
  Setter,
} from 'solid-js';
import {create, GenericStoreApi} from 'statebuilder';

export type Resource<T> = GenericStoreApi<T, Setter<T>>;

function makeResource<T>(
  resourceFetcher: ResourceFetcher<true, T, true>,
  options?: ResourceOptions<T, true>,
): Resource<T> {
  const [state, {mutate, refetch}] = createResource(
    resourceFetcher,
    options ?? {},
  );

  Reflect.set(state, 'refetch', refetch);
  Reflect.set(state, 'set', mutate);

  return state as unknown as Resource<T>;
}

export const experimental__defineResource = create('resource', makeResource);
