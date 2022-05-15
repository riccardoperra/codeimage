import {filter, map, Observable, OperatorFunction} from 'rxjs';

export type CompareFn<T> = (oldVal: T, newVal: T) => boolean;

export type KeyCompareMap<T extends object> = {
  [K in keyof Partial<T>]: CompareFn<T[K]>;
};

export type PickSlice<T extends object, K extends keyof T> = Pick<
  T,
  {[I in K]: I}[K]
>;

export function selectSlice<T extends object, K extends keyof T>(
  keys: K[],
): OperatorFunction<T, PickSlice<T, K>> {
  return (o$: Observable<T>): Observable<PickSlice<T, K>> =>
    o$.pipe(
      filter(state => state !== undefined),
      map(state => {
        if (state === null) {
          return null;
        }
        const definedKeys = keys.filter(
          k => state.hasOwnProperty(k) && state[k] !== undefined,
        );
        if (definedKeys.length < keys.length) {
          return undefined;
        }

        // create the selected slice
        return definedKeys.reduce((vm, key) => {
          vm[key] = state[key];
          return vm;
        }, {} as PickSlice<T, K>);
      }),
      filter((v): v is PickSlice<T, K> => v !== undefined),
    );
}
