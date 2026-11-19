import type {NotWrappable, Part, PathSetter} from 'solid-js';

export type PickMutable<T> = {
  [
    K in keyof T as (<U>() => U extends {
      [V in K]: T[V];
    }
      ? 1
      : 2) extends <U>() => U extends {
      -readonly [V in K]: T[V];
    }
      ? 1
      : 2
      ? K
      : never
  ]: T[K];
};
type W<T> = Exclude<T, NotWrappable>;
type KeyOf<T> = number extends keyof T
  ? 0 extends 1 & T
    ? keyof T
    : [T] extends [never]
      ? never
      : [T] extends [readonly unknown[]]
        ? number
        : keyof T
  : keyof T;
type MutableKeyOf<T> = KeyOf<T> & keyof PickMutable<T>;

export interface SetStoreFunction<T> {
  <
    K1 extends KeyOf<W<T>>,
    K2 extends KeyOf<W<W<T>[K1]>>,
    K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>,
    K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>,
    K5 extends KeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>,
    K6 extends KeyOf<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>>,
    K7 extends MutableKeyOf<W<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]>>,
  >(
    k1: Part<W<T>, K1>,
    k2: Part<W<W<T>[K1]>, K2>,
    k3: Part<W<W<W<T>[K1]>[K2]>, K3>,
    k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>,
    k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>,
    k6: Part<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>, K6>,
    k7: Part<W<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]>, K7>,
    setter: PathSetter<W<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]>[K7]>,
  ): void;

  <
    K1 extends KeyOf<W<T>>,
    K2 extends KeyOf<W<W<T>[K1]>>,
    K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>,
    K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>,
    K5 extends KeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>,
    K6 extends MutableKeyOf<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>>,
  >(
    k1: Part<W<T>, K1>,
    k2: Part<W<W<T>[K1]>, K2>,
    k3: Part<W<W<W<T>[K1]>[K2]>, K3>,
    k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>,
    k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>,
    k6: Part<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>, K6>,
    setter: PathSetter<W<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>[K6]>,
  ): void;

  <
    K1 extends KeyOf<W<T>>,
    K2 extends KeyOf<W<W<T>[K1]>>,
    K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>,
    K4 extends KeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>,
    K5 extends MutableKeyOf<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>>,
  >(
    k1: Part<W<T>, K1>,
    k2: Part<W<W<T>[K1]>, K2>,
    k3: Part<W<W<W<T>[K1]>[K2]>, K3>,
    k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>,
    k5: Part<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>, K5>,
    setter: PathSetter<W<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>[K5]>,
  ): void;

  <
    K1 extends KeyOf<W<T>>,
    K2 extends KeyOf<W<W<T>[K1]>>,
    K3 extends KeyOf<W<W<W<T>[K1]>[K2]>>,
    K4 extends MutableKeyOf<W<W<W<W<T>[K1]>[K2]>[K3]>>,
  >(
    k1: Part<W<T>, K1>,
    k2: Part<W<W<T>[K1]>, K2>,
    k3: Part<W<W<W<T>[K1]>[K2]>, K3>,
    k4: Part<W<W<W<W<T>[K1]>[K2]>[K3]>, K4>,
    setter: PathSetter<W<W<W<W<T>[K1]>[K2]>[K3]>[K4]>,
  ): void;

  <
    K1 extends KeyOf<W<T>>,
    K2 extends KeyOf<W<W<T>[K1]>>,
    K3 extends MutableKeyOf<W<W<W<T>[K1]>[K2]>>,
  >(
    k1: Part<W<T>, K1>,
    k2: Part<W<W<T>[K1]>, K2>,
    k3: Part<W<W<W<T>[K1]>[K2]>, K3>,
    setter: PathSetter<W<W<W<T>[K1]>[K2]>[K3]>,
  ): void;

  <K1 extends KeyOf<W<T>>, K2 extends MutableKeyOf<W<W<T>[K1]>>>(
    k1: Part<W<T>, K1>,
    k2: Part<W<W<T>[K1]>, K2>,
    setter: PathSetter<W<W<T>[K1]>[K2]>,
  ): void;

  <K1 extends MutableKeyOf<W<T>>>(
    k1: Part<W<T>, K1>,
    setter: PathSetter<W<T>[K1]>,
  ): void;

  (setter: PathSetter<T>): void;
}
