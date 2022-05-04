import {Store, StoreValue} from '@ngneat/elf';
import {parse, stringify} from 'query-string';
import {
  distinctUntilChanged,
  map,
  Observable,
  of,
  pairwise,
  ReplaySubject,
  skip,
  tap,
} from 'rxjs';
import shallow from './shallow';

interface Options<S extends Store> {
  source?: (store: S) => Observable<Partial<StoreValue<S>>>;
  keysToSync?: ReadonlyArray<keyof Store['state']>;
  key?: string;
  preStoreInit?: (value: StoreValue<S>) => Partial<StoreValue<S>>;

  runGuard?(): boolean;
}

export function persistQuery<S extends Store>(store: S, options: Options<S>) {
  const defaultOptions: Partial<Options<S>> = {
    source: store => store,
    keysToSync: Object.keys(store.initialState),
    preStoreInit: value => value,
    key: options.key ?? store.name,
    runGuard() {
      return typeof window !== 'undefined';
    },
  };

  const merged = {...defaultOptions, ...options} as Required<Options<S>>;

  if (!merged.runGuard?.()) {
    return {
      initialized$: of(false),
      unsubscribe() {
        //
      },
    };
  }

  function getFromQuery(key: string): Partial<StoreValue<S>> | null {
    const parsedQuery = parse(window.location.search, {
      parseBooleans: true,
      parseNumbers: true,
      decode: true,
      parseFragmentIdentifier: true,
    });

    const allowedEntries = Object.entries(parsedQuery)
      .filter(([k]) => k.includes(`${key}_`))
      .map(([k]) => k.replace(`${key}_`, ''))
      .filter(k => merged.keysToSync.includes(k));

    if (allowedEntries.length === 0) {
      return null;
    }

    return Object.fromEntries(
      Object.entries(parsedQuery)
        .filter(([k]) => k.includes(`${key}_`))
        .map(([k, v]) => [k.replace(`${key}_`, ''), v] as [string, string])
        .filter(([k]) => merged.keysToSync.includes(k)),
    ) as Partial<StoreValue<S>>;
  }

  function setQuery(key: string, value: Partial<StoreValue<S>>) {
    const params = new URLSearchParams(window.location.search);

    const objectToStringify = Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => merged.keysToSync.includes(k))
        .filter(
          ([, value]) =>
            value !== undefined && value !== null && typeof value !== 'object',
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

  const initialized$ = new ReplaySubject<boolean>(1);

  const loadFromQuerySubscription = of(getFromQuery(merged.key)).subscribe(
    value => {
      if (value) {
        store.update(state =>
          merged.preStoreInit({
            ...state,
            ...value,
          }),
        );
      }

      initialized$.next(true);
      initialized$.complete();
    },
  );

  const saveToQuerySubscription = merged
    .source(store)
    .pipe(
      map(state =>
        Object.fromEntries(
          Object.entries(state).filter(([k]) => merged.keysToSync.includes(k)),
        ),
      ),
      // ATTENTION: this is a workaround to skip emissions when state changes but query key is excluded
      pairwise(),
      map(([, b]) => b),
      distinctUntilChanged((a, b) => shallow(a, b)),
      skip(1),
      tap(state => setQuery(merged.key, state as Partial<StoreValue<S>>)),
    )
    .subscribe();

  return {
    initialized$: initialized$.asObservable(),
    unsubscribe() {
      saveToQuerySubscription.unsubscribe();
      loadFromQuerySubscription.unsubscribe();
    },
  };
}
