import {from, Observable, Observer, skip, Subscription, tap} from 'rxjs';
import {Accessor, createSignal, observable} from 'solid-js';

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
  const [value, notify] = createSignal<T | undefined>(undefined, {
    equals: false,
  });
  const [loading, setLoading] = createSignal(false);

  function dispatch(payload?: T | void) {
    setLoading(true);
    notify(() => payload ?? undefined);
  }

  // eslint-disable-next-line solid/reactivity
  const valueNotifier$ = from(observable(value)).pipe(
    skip(1),
    tap(() => setLoading(false)),
  ) as unknown as Observable<T>;

  const subscription = effectGeneratorCallback(valueNotifier$).subscribe();

  // eslint-disable-next-line solid/reactivity
  const loadingAccessor = Object.assign(
    loading,
    // eslint-disable-next-line solid/reactivity
    from(observable(loading)) as Observable<boolean>,
  );

  return Object.assign(dispatch, {
    watch: valueNotifier$.subscribe.bind(valueNotifier$),
    dispose: () => subscription.unsubscribe(),
    loading: loadingAccessor,
  });
}
