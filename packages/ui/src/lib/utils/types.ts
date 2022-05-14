import {mergeProps} from 'solid-js';

type Simplify<T> = T extends object ? {[K in keyof T]: T[K]} : T;
type UnboxLazy<T> = T extends () => infer U ? U : T;
type RequiredKeys<T> = keyof {
  [K in keyof T as T extends {[_ in K]: unknown} ? K : never]: 0;
};
type Override<T, U> = {
  // all keys in T which are not overridden by U
  [K in keyof Omit<T, RequiredKeys<U>>]:
    | T[K]
    | Exclude<U[K & keyof U], undefined>;
} & {
  // all keys in U except those which are merged into T
  [K in keyof Omit<U, Exclude<keyof T, RequiredKeys<U>>>]:
    | Exclude<U[K], undefined>
    | (undefined extends U[K] ? (K extends keyof T ? T[K] : undefined) : never);
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type MergeProps<T extends unknown[], Curr = {}> = T extends [
  infer Next,
  ...infer Rest,
]
  ? MergeProps<
      Rest,
      Next extends object
        ? // eslint-disable-next-line @typescript-eslint/ban-types
          Next extends Function
          ? Curr
          : // This is the line that fix the issue
          Next extends infer U
          ? Override<Curr, UnboxLazy<U>>
          : never
        : Curr
    >
  : Simplify<Curr>;

export const mergeProps2: <T extends [unknown, ...unknown[]]>(
  ...sources: T
) => MergeProps<T> = mergeProps as any;
