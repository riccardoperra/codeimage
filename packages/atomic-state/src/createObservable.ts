import {Observable} from 'rxjs';
import type {Accessor} from 'solid-js';
import {createEffect, createRoot} from 'solid-js';

export function createObservable<T>(read: Accessor<T>): Observable<T> {
  return new Observable(subscriber =>
    createRoot(dispose => {
      createEffect(read, value => subscriber.next(value));
      return dispose;
    }),
  );
}
