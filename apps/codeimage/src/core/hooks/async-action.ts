import type {Accessor} from 'solid-js';
import type {
  Resource,
  ResourceActions,
} from '@codeimage/store/plugins/create-resource';
import {createResource} from '@codeimage/store/plugins/create-resource';
import {createSignal, merge} from 'solid-js';

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

  const [resource, _resourceActions] = createResource<
    T | symbol | undefined,
    R
  >(notifier || internalNotifier, async args => fetcher(args as T));

  const notify = (value?: T) => {
    return setNotifier(() => value ?? Symbol());
  };

  const resourceActions = merge(
    {
      notify,
    },
    _resourceActions,
  );

  return [resource, resourceActions];
}
