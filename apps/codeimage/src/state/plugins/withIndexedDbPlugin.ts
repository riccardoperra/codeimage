import {makePlugin} from 'statebuilder';
import {useIdb} from '../../hooks/use-indexed-db';

export function withIndexedDbPlugin<T>(idbKey: string, fallbackValue: T) {
  const idb = useIdb();

  return makePlugin(
    _ => {
      return {
        idb: {
          get(): Promise<T> {
            // idb-keyval throws at once where IndexedDB does not exist, as in
            // the Node renderer, so start from a promise to catch it.
            return Promise.resolve()
              .then(() => idb.get<T>(idbKey))
              .then(data => data ?? fallbackValue)
              .catch(() => fallbackValue);
          },
          set(data: T) {
            return Promise.resolve().then(() => idb.set(idbKey, data));
          },
          update(updaterFn: (data: T) => T) {
            return idb.update(idbKey, data => updaterFn(data));
          },
          hydrateOnInit() {
            return new Promise(resolve => {
              return this.get().then(data => {
                _.set(() => data);
                resolve(data);
              });
            });
          },
        },
      };
    },
    {name: 'withIndexedDbPlugin'},
  );
}
