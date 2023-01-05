import {SetStoreFunction} from 'solid-js/store';
import {getStoreInternals} from './getStoreInternals';

// eslint-disable-next-line @typescript-eslint/ban-types
type StoreKeys<S extends {}> = keyof S extends infer U
  ? U extends string
    ? U
    : never
  : never;

// eslint-disable-next-line @typescript-eslint/ban-types
export type SetterPropUpdater<S extends {}, K extends keyof S> = (
  ...args: Parameters<SetStoreFunction<S[K]>>
) => void;

// eslint-disable-next-line @typescript-eslint/ban-types
type AutoPropsFactory<S extends {}> = {
  [K in `set${Capitalize<StoreKeys<S>>}`]: K extends `set${infer OriginalProp}`
    ? SetterPropUpdater<S, Uncapitalize<OriginalProp> & keyof S>
    : never;
};

// eslint-disable-next-line @typescript-eslint/ban-types
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ($$setter as any)(...fnArgs);
        };
      },
    },
  );
}
