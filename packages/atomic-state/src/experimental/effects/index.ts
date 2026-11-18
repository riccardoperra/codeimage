import type {Observable, Observer, Subscription} from 'rxjs';
import {Subject, tap} from 'rxjs';
import type {Accessor} from 'solid-js';
import {createSignal} from 'solid-js';
import {createObservable} from '../../createObservable';

export interface Effect<T> {
  (payload: T): void;

  (payload?: void): void;

  watch(observer: Partial<Observer<T>>): Subscription;

  dispose(): void;

  loading: Accessor<boolean> & Observable<boolean>;
}

export function effect<T>(
  effectGeneratorCallback: (data: Observable<T>) => Observable<unknown>,
): Effect<T> {
  const values = new Subject<T>();
  const [loading, setLoading] = createSignal(false);

  function dispatch(payload?: T | void) {
    setLoading(true);
    values.next(payload as T);
  }

  const valueNotifier$ = values.pipe(tap(() => setLoading(false)));

  const subscription = effectGeneratorCallback(valueNotifier$).subscribe();

  const loading$ = createObservable(loading);
  const loadingAccessor = new Proxy(loading, {
    get(target, key) {
      if (!Reflect.has(loading$, key)) return Reflect.get(target, key);
      const value = Reflect.get(loading$, key);
      return typeof value === 'function' ? value.bind(loading$) : value;
    },
  }) as Effect<T>['loading'];

  return Object.assign(dispatch, {
    watch: valueNotifier$.subscribe.bind(valueNotifier$),
    dispose: () => {
      values.complete();
      subscription.unsubscribe();
    },
    loading: loadingAccessor,
  });
}
