import {Store} from 'solid-js/store';
import getStoreInternals from './getStoreInternals';

export function withEvent<
  T extends {},
  CallbackParams extends unknown[],
  CallbackReturn,
>(
  store: Store<T>,
  callback: (
    ...params: CallbackParams
  ) => CallbackReturn | Promise<CallbackReturn>,
  eventName: string,
) {
  const {events$} = getStoreInternals(store);

  return (...args: CallbackParams) => {
    const result = callback(...args);

    if (result instanceof Promise) {
      result.then(value =>
        events$.next({
          type: eventName,
          value,
        }),
      );
    } else {
      events$.next({
        type: eventName,
        value: result,
      });
    }
  };
}
