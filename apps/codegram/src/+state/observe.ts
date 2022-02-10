import {Observable, Subject, takeUntil} from 'rxjs';
import {createSignal, onCleanup} from 'solid-js';
import {createStore, reconcile} from 'solid-js/store';

export function observe<T>(
  input: Observable<T>,
  defaultValue?: T,
  destroy$ = onCleanup$(),
) {
  const [state, setState] = createSignal<T>(defaultValue as T);
  input.pipe(takeUntil(destroy$)).subscribe(value => setState(() => value));
  return state;
}

export function observeState<T extends Record<string, unknown>>(
  input: Observable<T>,
  defaultValue?: T,
  destroy$ = onCleanup$(),
) {
  const [state, setState] = createStore<T>(defaultValue as T);
  input
    .pipe(takeUntil(destroy$))
    .subscribe(value => setState(reconcile(value)));
  return state;
}

/** Returns an observable that emits once when a component is cleaned up */
export function onCleanup$() {
  const obs = new Subject<void>();

  onCleanup(() => {
    obs.next();
    obs.complete();
  });

  return obs.asObservable();
}
