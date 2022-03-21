// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck TODO: failing type 44,14?

import {SetStoreFunction, Store} from 'solid-js/store';
import {parse, stringify} from 'query-string';
import {SolidStorePlugin} from './create-pluggable-store';

export function withQueryPersist<S>(
  options: WithQueryPersistOptions<S>,
): SolidStorePlugin<S> {
  return <TState>(get: Store<TState>, set: SetStoreFunction<TState>) => {
    const defaultSet = set;
    let queryInitialized = false;

    const defaultOptions = {
      keysToSync: Object.keys(get),
      key: options.key,
    };

    const merged = {...defaultOptions, ...options} as Required<
      WithQueryPersistOptions<S>
    >;

    const defaultQuery = getFromQuery(merged.key);
    if (!!defaultQuery) {
      defaultSet(state => ({...state, ...defaultQuery}));
    }

    function getFromQuery(key: string): Partial<Store<TState>> | null {
      const parsedQuery = parse(window.location.search, {
        parseBooleans: true,
        parseNumbers: true,
        decode: true,
        parseFragmentIdentifier: true,
      });

      const allowedEntries = Object.entries(parsedQuery)
        .filter(([k]) => k.includes(`${key}_`))
        .map(([k]) => k.replace(`${key}_`, ''))
        .filter(k => merged.keysToSync.includes(k as keyof S));

      if (allowedEntries.length === 0) {
        return null;
      }

      return Object.fromEntries(
        Object.entries(parsedQuery)
          .filter(([k]) => k.includes(`${key}_`))
          .map(([k, v]) => [k.replace(`${key}_`, ''), v] as [string, string])
          .filter(([k]) => merged.keysToSync.includes(k as keyof S)),
      ) as Partial<Store<TState>>;
    }

    function setQuery(key: string, value: Partial<Store<TState>>) {
      const params = new URLSearchParams(window.location.search);

      const objectToStringify = Object.fromEntries(
        Object.entries(value)
          .filter(([k]) => merged.keysToSync.includes(k as keyof S))
          .filter(
            ([, value]) =>
              value !== undefined &&
              value !== null &&
              typeof value !== 'object',
          ),
      );

      const query = stringify(objectToStringify);
      const parsedQuery = parse(query);

      Object.entries(parsedQuery).forEach(([k, v]) =>
        params.set(`${key}_${k}`, v as string),
      );

      window.history.replaceState(
        Object.fromEntries(params.entries()),
        '',
        `?${params}`,
      );
    }

    set = (...args: unknown[]): ReturnType<SetStoreFunction<S>> => {
      const result = defaultSet(
        ...(args as Parameters<SetStoreFunction<TState>>),
      );
      if (queryInitialized) {
        setQuery(merged.key, get);
      }
      queryInitialized = true;
      return result;
    };

    return [get, set, {}];
  };
}

interface WithQueryPersistOptions<S> {
  keysToSync?: ReadonlyArray<keyof S>;
  key?: string;
}
