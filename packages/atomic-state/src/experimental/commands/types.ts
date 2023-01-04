import {Observable} from 'rxjs';

export type ValuesOf<O> = O[keyof O];
// type Keys = KeysOf<{ a: string, b: number }>; // "a" | "b"
export type KeysOf<O> = keyof O;

// class vs instance
type InstanceOrType<T> = T extends abstract new (...args: any) => infer R
  ? R
  : T;

// We infer all arguments instead of just the first one as we are more flexible for later changes
type InferArguments<T> = T extends (...args: infer R) => any ? R : never;

// It helps to infer the type of an objects key
// We have to use it because using just U[K] directly would @TODO
type Select<U, K> = K extends keyof U ? U[K] : never;

type ExtractString<T extends object> = Extract<keyof T, string>;

// Helper to get either the params of the transform function, or if the function is not present a fallback type
type FunctionParamsOrValueType<U, K, F> = InferArguments<
  Select<U, K>
> extends never
  ? [F]
  : InferArguments<Select<U, K>>;

export type Actions = {};

export type ActionTransforms<T extends {}> = Partial<{
  [K in keyof T]: (...args: any[]) => T[K];
}>;

export type ActionDispatchFn<O extends unknown[]> = (
  ...value: InstanceOrType<O>
) => void;

export type ActionDispatchers<T extends Actions, U extends {}> = {
  [K in keyof T]: ActionDispatchFn<
    FunctionParamsOrValueType<U, K, Select<T, K>>
  >;
};

export type ActionObservables<T extends Actions> = {
  [K in ExtractString<T> as `${K}$`]: Observable<InstanceOrType<T[K]>>;
};

export type RxActions<T extends Actions, U extends {} = T> = ActionDispatchers<
  T,
  U
> &
  ActionObservables<T> &
  ((slice: Partial<T>) => void) & {
    $: (props: (keyof T)[]) => Observable<ValuesOf<T>>;
  };
