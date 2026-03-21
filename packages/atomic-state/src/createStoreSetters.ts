import type {SetStoreFunction} from './experimental/store-types';
import {getStoreInternals} from './getStoreInternals';

type StoreKeys<S extends Record<string, unknown>> = keyof S extends infer U
  ? U extends string
    ? U
    : never
  : never;

export type SetterPropUpdater<
  S extends Record<string, unknown>,
  K extends keyof S,
> = (...args: Parameters<SetStoreFunction<S[K]>>) => void;

type AutoPropsFactory<S extends Record<string, unknown>> = {
  [K in `set${Capitalize<StoreKeys<S>>}`]: K extends `set${infer OriginalProp}`
    ? SetterPropUpdater<S, Uncapitalize<OriginalProp> & keyof S>
    : never;
};

export function createStoreAutoSetters<T extends Record<string, unknown>>(
  store: T,
): AutoPropsFactory<T> {
  const {$$setter} = getStoreInternals(store);

  return new Proxy<AutoPropsFactory<T>>(
    {},
    {
      get(_, property: string) {
        return (...args: unknown[]) => {
          const [, prop] = property.split('set');
          const lowerProperty = prop.charAt(0).toLowerCase() + prop.slice(1);
          const localSetter = $$setter as (...args: unknown[]) => void;
          localSetter(lowerProperty, ...args);
        };
      },
    },
  );
}
