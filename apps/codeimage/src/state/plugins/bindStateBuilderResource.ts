import {
  createResource,
  type ResourceFetcher,
  type ResourceOptions,
  type Setter,
  type Resource as InternalResource,
} from 'solid-js';
import {create, type GenericStoreApi} from 'statebuilder';

export type Resource<T> = GenericStoreApi<T, Setter<T>> & InternalResource<T>;

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
