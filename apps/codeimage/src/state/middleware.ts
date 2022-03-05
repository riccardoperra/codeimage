import {GetState, SetState, State, StateCreator, StoreApi} from 'zustand';
import {NamedSet} from 'zustand/middleware';
import {parse, stringify} from 'query-string';

interface QueryOptions {
  debounce: number;
  prefix: string;
}

export const query = <
  T extends State,
  CustomSetState extends SetState<T>,
  CustomGetState extends GetState<T>,
  CustomStoreApi extends StoreApi<T>,
>(
  fn: StateCreator<
    T,
    CustomSetState & NamedSet<T>,
    CustomGetState,
    CustomStoreApi
  >,
  options: QueryOptions,
): StateCreator<
  T,
  CustomSetState & NamedSet<T>,
  CustomGetState,
  CustomStoreApi
> => {
  let timeoutId: number | undefined;

  return (set, get, api) => {
    const parsedQuery = parse(window.location.search, {
      parseBooleans: true,
      parseNumbers: true,
      decode: true,
      parseFragmentIdentifier: true,
    });

    const entries = Object.entries(parsedQuery);

    if (entries.length > 0) {
      queueMicrotask(() => {
        const allowedEntries = entries
          .filter(([k]) => k.includes(`${options.prefix}_`))
          .map(([k]) => k.replace(`${options.prefix}_`, ''))
          .filter(k => Object.keys(get()).includes(k));
        if (allowedEntries.length > 0) {
          const state = Object.fromEntries(
            entries
              .filter(([k]) => k.includes(`${options.prefix}_`))
              .map(
                ([k, v]) =>
                  [k.replace(`${options.prefix}_`, ''), v] as [string, string],
              )
              .filter(([k]) => Object.keys(get()).includes(k)),
          );
          console.log(state);
          set(state as any, false, {type: '@@INIT/query'});
        }
      });
    }

    function replaceQuery(state: Partial<T>): void {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const query = stringify(
          Object.fromEntries(
            Object.entries(state).filter(
              ([, v]) =>
                v !== null && v !== undefined && typeof v !== 'function',
            ),
          ),
        );
        const parsedQuery = parse(query);
        console.log(parsedQuery, query);
        Object.entries(parsedQuery).forEach(([k, v]) =>
          params.set(`${options.prefix}_${k}`, v as string),
        );
        window.history.replaceState(null, '', `?${params}`);
      }, options.debounce);
    }

    const savedSetState = api.setState;

    api.setState = (state, replace) => {
      savedSetState(state, replace);
      void replaceQuery(state as any);
    };

    return fn(
      (pState, replace) => {
        set(pState, replace);
        replaceQuery((pState as any)() as Partial<T>);
      },
      get,
      api,
    );
  };
};
