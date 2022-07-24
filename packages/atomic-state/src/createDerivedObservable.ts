import {from, Observable} from 'rxjs';
import {createMemo, observable} from 'solid-js';

export function createDerivedObservable<T>(selector: () => T) {
  const memoized = createMemo(selector);
  const observable$ = observable(memoized);
  const rxjsState$ = from(observable$ as unknown as Observable<T>);
  return [rxjsState$, memoized] as const;
}
