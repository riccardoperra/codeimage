import {Observable} from 'rxjs';
import {createStore, reconcile} from 'solid-js/store';
import {select} from '@ngneat/elf';
import {onCleanup} from 'solid-js';

export function fromObservableObject<T>(store: Observable<T>) {
  const initialValue = {} as T;
  const [state, setState] = createStore<T>(initialValue);
  const sub = store.pipe(select(state => state)).subscribe(nextState => {
    setState(reconcile(nextState));
  });
  onCleanup(() => sub.unsubscribe());
  return state;
}
