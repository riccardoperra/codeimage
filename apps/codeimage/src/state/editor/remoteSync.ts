import {
  debounceTime,
  EMPTY,
  filter,
  from,
  type Observable,
  switchMap,
  tap,
} from 'rxjs';

export interface RemoteProject {
  id: () => string | undefined;
  loggedIn: () => boolean;
  readOnly: () => boolean;
}

export function remoteSaves<T>(
  changes$: Observable<T>,
  project: RemoteProject,
  save: (id: string, state: T) => Promise<unknown>,
  setPending: (pending: boolean) => void,
): Observable<unknown> {
  return changes$.pipe(
    debounceTime(150),
    filter(() => project.loggedIn() && !project.readOnly()),
    tap(() => setPending(true)),
    debounceTime(3000),
    tap(() => setPending(false)),
    switchMap(state => {
      const id = project.id();
      if (!id) return EMPTY;
      return from(save(id, state));
    }),
  );
}
