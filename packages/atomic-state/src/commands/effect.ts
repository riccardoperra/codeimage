import {from, Observable, Observer, skip, Subscription} from 'rxjs';
import {createSignal, observable} from 'solid-js';

interface Effect<T> {
  (payload: T): void;

  watch(observer: Partial<Observer<T>>): Subscription;

  dispose(): void;
}

export function effect<T>(
  effectGeneratorCallback: (data: Observable<T>) => Observable<unknown>,
): Effect<T> {
  const [value, notify] = createSignal<T | undefined>(undefined, {
    equals: false,
  });

  function dispatch(payload: T) {
    notify(() => payload);
  }

  // eslint-disable-next-line solid/reactivity
  const valueNotifier$ = from(observable(value)).pipe(
    skip(1),
  ) as unknown as Observable<T>;

  const subscription = effectGeneratorCallback(valueNotifier$).subscribe();

  return Object.assign(dispatch, {
    watch: valueNotifier$.subscribe.bind(valueNotifier$),
    dispose: () => subscription.unsubscribe(),
  });
}
