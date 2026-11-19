import {createPlugin} from 'statebuilder';
import {useIdb} from '../../hooks/use-indexed-db';

export function withIndexedDbPlugin<T>(idbKey: string, fallbackValue: T) {
  const idb = useIdb();

  return createPlugin(
    () => {
      return {
        idb: {
          get(): Promise<T> {
            return Promise.resolve()
              .then(() => idb.get<T>(idbKey))
              .then(data => data ?? fallbackValue)
              .catch(() => fallbackValue);
          },
          set(data: T) {
            return Promise.resolve().then(() => idb.set(idbKey, data));
          },
          update(updaterFn: (data: T) => T) {
            return idb.update<T>(idbKey, data =>
              updaterFn(data ?? fallbackValue),
            );
          },
        },
      };
    },
    {name: 'withIndexedDbPlugin'},
  );
}
