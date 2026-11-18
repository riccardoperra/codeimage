import type {Accessor, Setter} from 'solid-js';
import {createMemo, createSignal, latest, refresh, untrack} from 'solid-js';

type Status = 'unresolved' | 'pending' | 'ready' | 'refreshing' | 'errored';

export interface Resource<T> extends Accessor<T> {
  readonly state: Status;
  readonly loading: boolean;
  readonly latest: T;
  readonly error: unknown;
}

export interface ResourceActions<T> {
  mutate: Setter<T>;
  refetch: (info?: unknown) => Promise<T>;
  peek: () => T;
}

export type ResourceReturn<T> = [Resource<T>, ResourceActions<T>];

export interface ResourceOptions<T> {
  initialValue?: T;
}

export type ResourceFetcher<S, T> = (
  source: S,
  info: {value: T | undefined; refetching: unknown},
) => T | PromiseLike<T>;

type Key<S> = S | false | null | undefined;
type Source<S> = Key<S> | Accessor<Key<S>>;

type Outcome<T> =
  | {state: 'ready' | 'unresolved'; value: T | undefined; token?: symbol}
  | {state: 'errored'; value: T | undefined; error: unknown; token: symbol};

export function createResource<T>(
  fetcher: ResourceFetcher<true, T>,
  options: ResourceOptions<T> & {initialValue: T},
): ResourceReturn<T>;
export function createResource<T>(
  fetcher: ResourceFetcher<true, T>,
  options?: ResourceOptions<T>,
): ResourceReturn<T | undefined>;
export function createResource<S, T>(
  source: Source<S>,
  fetcher: ResourceFetcher<S, T>,
  options: ResourceOptions<T> & {initialValue: T},
): ResourceReturn<T>;
export function createResource<S, T>(
  source: Source<S>,
  fetcher: ResourceFetcher<S, T>,
  options?: ResourceOptions<T>,
): ResourceReturn<T | undefined>;
export function createResource<S, T>(
  source: Source<S> | ResourceFetcher<true, T>,
  fetcherOrOptions?: ResourceFetcher<S, T> | ResourceOptions<T>,
  explicitOptions?: ResourceOptions<T>,
): ResourceReturn<T | undefined> {
  const hasSource = typeof fetcherOrOptions === 'function';
  const options = hasSource ? explicitOptions : fetcherOrOptions;
  const fetcher = (hasSource ? fetcherOrOptions : source) as ResourceFetcher<
    Key<S> | true,
    T
  >;
  function readKey() {
    if (!hasSource) return true;
    if (typeof source === 'function') return (source as Accessor<Key<S>>)();
    return source;
  }
  const initial: Outcome<T> = {
    value: options?.initialValue,
    state: options && 'initialValue' in options ? 'ready' : 'unresolved',
  };
  let refetching: unknown = false;
  let settled: Outcome<T> = initial;
  let currentToken: symbol | undefined;
  const request = createMemo(() => {
    const key = readKey();
    const info = refetching;
    refetching = false;
    if (key === false || key === null || key === undefined) {
      currentToken = undefined;
      return undefined;
    }
    const token = Symbol();
    currentToken = token;
    function resolve(outcome: Outcome<T>) {
      if (currentToken === token) settled = outcome;
      return outcome;
    }
    const failed = (error: unknown) =>
      resolve({state: 'errored', value: settled.value, token, error});
    const value = settled.value;
    try {
      const next = hasSource
        ? untrack(() => fetcher(key, {value, refetching: info}))
        : fetcher(key, {value, refetching: info});
      const promise = Promise.resolve(next).then(
        value => resolve({state: 'ready', value, token}),
        failed,
      );
      return {token, promise};
    } catch (error) {
      return {token, promise: Promise.resolve(failed(error))};
    }
  });
  const [result, setResult] = createSignal<Outcome<T>>(
    previous => request()?.promise ?? previous ?? initial,
    {loadingValue: initial, ownedWrite: true},
  );
  const readLatest = () => latest(result);
  const readValue = () => {
    const next = result();
    if (next.state === 'errored') throw next.error;
    return next.value;
  };
  const readState = (): Status => {
    const pending = request();
    const {state, token} = readLatest();
    if (!pending || token === pending.token) return state;
    return state === 'unresolved' ? 'pending' : 'refreshing';
  };
  const resource: Resource<T | undefined> = Object.defineProperties(readValue, {
    state: {get: readState},
    loading: {
      get: () => {
        const state = readState();
        return state === 'pending' || state === 'refreshing';
      },
    },
    latest: {get: () => readLatest().value},
    error: {
      get: () => {
        const next = readLatest();
        return next.state === 'errored' ? next.error : undefined;
      },
    },
  }) as Resource<T | undefined>;

  const mutate = ((next?: T | ((previous: T | undefined) => T | undefined)) => {
    const value =
      typeof next === 'function'
        ? (next as (previous: T | undefined) => T | undefined)(settled.value)
        : next;
    settled = {state: 'ready', value, token: currentToken};
    setResult(settled);
    return value;
  }) as Setter<T | undefined>;

  return [
    resource,
    {
      mutate,
      peek: () => settled.value,
      refetch: async (info = true) => {
        refetching = info;
        const next = await refresh(request);
        return (await next?.promise)?.value ?? settled.value;
      },
    },
  ];
}
