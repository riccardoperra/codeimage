import {
  createResource,
  createSignal,
  from,
  mergeProps,
  Resource,
} from 'solid-js';
import {Observable, Subject} from 'rxjs';
import {ResourceActions} from 'solid-js/types/reactive/signal';

interface AsyncResourceActions<T, R> extends ResourceActions<R | undefined> {
  notify: (value: T) => void;
}

export function useAsyncAction<T, R>(
  fetcher: (ref: T) => Promise<R>,
  notifier?: Subject<T>,
): [Resource<R | undefined>, AsyncResourceActions<T, R | undefined>] {
  const [internalNotifier, setNotifier] = createSignal<T | undefined>(
    undefined,
    {
      equals: false,
    },
  );

  const [resource, _resourceActions] = createResource(
    (notifier instanceof Observable ? from(notifier) : notifier) ||
      internalNotifier,
    fetcher,
  );

  const notify = (value: T) => {
    return setNotifier(() => value);
  };

  const resourceActions = mergeProps(
    {
      notify,
    },
    _resourceActions,
  );

  return [resource, resourceActions];
}
