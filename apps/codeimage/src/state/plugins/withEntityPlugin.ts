import {type Setter} from 'solid-js';
import {type GenericStoreApi, makePlugin} from 'statebuilder';

export function withEntityPlugin<T extends unknown[]>() {
  type TItem = T[number];

  return makePlugin(
    (storeApi: GenericStoreApi<T, Setter<T>>) => {
      return {
        entity: {
          updateBy(
            matcherFn: (data: TItem) => boolean,
            updaterFn: (oldValue: TItem) => TItem,
          ) {
            return storeApi.set(items => {
              return items.map(item => {
                if (matcherFn(item)) {
                  return updaterFn(item);
                }
                return item as TItem;
              }) as T;
            });
          },
          removeBy(matcherFn: (data: TItem) => boolean) {
            return storeApi.set(
              items => items.filter(item => !matcherFn(item)) as T,
            );
          },
        },
      };
    },
    {name: 'withEntityPlugin'},
  );
}
