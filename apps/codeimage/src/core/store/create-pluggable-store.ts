import {
  createStore as _createStore,
  SetStoreFunction,
  Store,
} from 'solid-js/store';

export type SolidStorePlugin<T, Result extends object = object> = <
  TState extends T,
>(
  get: Store<TState>,
  set: SetStoreFunction<TState>,
) => [get: Store<TState>, set: SetStoreFunction<TState>, meta: Result];

type PluginArgs<T extends readonly SolidStorePlugin<unknown>[]> = T extends [
  infer Start,
  // eslint-disable-next-line prettier/prettier
  ...infer Rest
]
  ? Start extends SolidStorePlugin<unknown, infer E>
    ? E & PluginArgs<Rest extends SolidStorePlugin<unknown>[] ? Rest : []>
    : never
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {};

export function createPluggableStore<
  T extends object,
  Plugins extends readonly SolidStorePlugin<T>[],
  PluginMeta extends PluginArgs<Plugins> = PluginArgs<Plugins>,
>(
  initState: T,
  ...plugins: [...Plugins]
): [get: Store<T>, set: SetStoreFunction<T>, extra: PluginMeta] {
  const [_state, _setState] = _createStore(initState);
  const [get, set, extra] = plugins.reduceRight(
    ([_get, _set, _meta], plugin) => {
      const [get, set, meta] = plugin(_get as Store<T>, _set);
      return [get, set, {..._meta, ...meta}];
    },
    [_state, _setState, {}] as const,
  );
  return [get as Store<T>, set, extra as PluginMeta];
}
