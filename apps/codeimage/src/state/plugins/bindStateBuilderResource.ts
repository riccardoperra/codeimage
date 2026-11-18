import type {Setter} from 'solid-js';
import type {GenericStoreApi} from 'statebuilder';
import {create} from 'statebuilder';
import {createResource} from './create-resource';
import type {
  ResourceFetcher,
  ResourceOptions,
  Resource as InternalResource,
} from './create-resource';

export type Resource<T> = GenericStoreApi<T, Setter<T>> & InternalResource<T>;

function makeResource<T>(
  resourceFetcher: ResourceFetcher<true, T>,
  options: ResourceOptions<T> & {initialValue: T},
): Resource<T> {
  const [state, {mutate, refetch, peek}] = createResource(
    resourceFetcher,
    options,
  );

  Reflect.set(state, 'refetch', refetch);
  Reflect.set(state, 'set', mutate);
  Reflect.set(state, 'peek', peek);

  return state as unknown as Resource<T>;
}

export const experimental__defineResource = create('resource', makeResource);
