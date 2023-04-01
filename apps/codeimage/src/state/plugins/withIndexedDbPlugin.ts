import {makePlugin} from 'statebuilder';
import {useIdb} from '../../hooks/use-indexed-db';

export function withIndexedDbPlugin<T>(idbKey: string, fallbackValue: T) {
  const idb = useIdb();

  return makePlugin(
    () => {
      return {
        idb: {
          get(): Promise<T> {
            return idb
              .get<T>(idbKey)
              .then(data => data ?? fallbackValue)
              .catch(() => fallbackValue);
          },
          set(data: T) {
            return idb.set(idbKey, data);
          },
          update(updaterFn: (data: T) => T) {
            return this.get().then(data => this.set(updaterFn(data)));
          },
        },
      };
    },
    {name: 'withIndexedDbPlugin'},
  );
}
