import {mergeProps} from 'solid-js';

type Override<T, U> = T extends object
  ? U extends object
    ? {
        [K in keyof T]: K extends keyof U
          ? undefined extends U[K]
            ? Exclude<U[K], undefined> | T[K]
            : U[K]
          : T[K];
      } & {
        [K in keyof U]: K extends keyof T
          ? undefined extends U[K]
            ? Exclude<U[K], undefined> | T[K]
            : U[K]
          : U[K];
      }
    : T & U
  : T & U;

// eslint-disable-next-line @typescript-eslint/ban-types
export type MergeProps<T extends unknown[], Curr = {}> = T extends [
  infer Next | (() => infer Next),
  ...infer Rest,
]
  ? MergeProps<Rest, Override<Curr, Next>>
  : Curr;

export const mergeProps2: <T extends [unknown, ...unknown[]]>(
  ...sources: T
) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
MergeProps<T> = mergeProps as any;
