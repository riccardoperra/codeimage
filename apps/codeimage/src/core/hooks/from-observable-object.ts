import {Observable} from 'rxjs';
import {createStore, reconcile} from 'solid-js/store';
import {select} from '@ngneat/elf';
import {onCleanup} from 'solid-js';

// eslint-disable-next-line @typescript-eslint/ban-types
export function fromObservableObject<T extends {}>(store: Observable<T>) {
  const initialValue = {} as T;
  const [state, setState] = createStore(initialValue);
  const sub = store.pipe(select(state => state)).subscribe(nextState => {
    setState(reconcile(nextState));
  });
  onCleanup(() => sub.unsubscribe());
  return state;
}
