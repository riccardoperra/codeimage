import {createMemo} from 'solid-js';
import {createObservable} from './createObservable';

export function createDerivedObservable<T>(selector: () => T) {
  const memoized = createMemo(selector);
  const rxjsState$ = createObservable(memoized);
  return [rxjsState$, memoized] as const;
}
