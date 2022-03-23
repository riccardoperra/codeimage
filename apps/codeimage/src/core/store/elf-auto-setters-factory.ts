import {setProp, Store, StoreValue} from '@ngneat/elf';

type StoreKeys<S extends Store> = keyof StoreValue<S> extends infer U
  ? U extends string
    ? U
    : never
  : never;

export type ElfPropUpdater<S extends Store, K extends string> = (
  arg: StoreValue<S>[K],
) => void;

type AutoPropsFactory<S extends Store> = {
  [K in `set${Capitalize<StoreKeys<S>>}`]: K extends `set${infer OriginalProp}`
    ? ElfPropUpdater<S, Uncapitalize<OriginalProp>>
    : never;
};

function capitalize<T extends string>(str: T): Capitalize<T> {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>;
}

export function elfAutoSettersFactory<S extends Store>(
  store: S,
): AutoPropsFactory<S> {
  return Object.fromEntries(
    Object.keys(store.initialState).map(k => [
      `set${capitalize(k)}`,
      (arg: StoreValue<S>[string]) => store.update(setProp(k, arg)),
    ]),
  ) as AutoPropsFactory<S>;
}
