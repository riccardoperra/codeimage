import {
  type Accessor,
  createResource,
  createSignal,
  mergeProps,
  type Resource,
  type ResourceActions,
} from 'solid-js';

interface AsyncResourceActions<T, R> extends ResourceActions<R | undefined> {
  notify: (value?: T) => void;
}

export function createAsyncAction<T, R>(
  fetcher: (ref: T) => Promise<R>,
  notifier?: Accessor<T>,
): [Resource<R | undefined>, AsyncResourceActions<T, R | undefined>] {
  const [internalNotifier, setNotifier] = createSignal<T | symbol | undefined>(
    undefined,
    {
      equals: false,
    },
  );

  const [resource, _resourceActions] = createResource(
    notifier || internalNotifier,
    async args => fetcher(args as T),
  );

  const notify = (value?: T) => {
    return setNotifier(() => value ?? Symbol());
  };

  const resourceActions = mergeProps(
    {
      notify,
    },
    _resourceActions,
  );

  return [resource, resourceActions];
}
