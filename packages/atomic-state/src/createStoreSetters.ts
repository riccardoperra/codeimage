import {SetStoreFunction} from 'solid-js/store';
import {getStoreInternals} from './getStoreInternals';

type StoreKeys<S extends {}> = keyof S extends infer U
  ? U extends string
    ? U
    : never
  : never;

export type SetterPropUpdater<S extends {}, K extends keyof S> = (
  ...args: Parameters<SetStoreFunction<S[K]>>
) => void;

type AutoPropsFactory<S extends {}> = {
  [K in `set${Capitalize<StoreKeys<S>>}`]: K extends `set${infer OriginalProp}`
    ? SetterPropUpdater<S, Uncapitalize<OriginalProp> & keyof S>
    : never;
};

export function createStoreAutoSetters<T extends {}>(
  store: T,
): AutoPropsFactory<T> {
  const {$$setter} = getStoreInternals(store);

  return new Proxy<AutoPropsFactory<T>>(
    {},
    {
      get(_, property: string) {
        return (...args: Parameters<typeof $$setter>) => {
          const [, prop] = property.split('set');
          const lowerProperty = prop.charAt(0).toLowerCase() + prop.slice(1);
          const fnArgs = [lowerProperty, ...args] as unknown as Parameters<
            typeof $$setter
          >;
          $$setter(...fnArgs);
        };
      },
    },
  );
}
