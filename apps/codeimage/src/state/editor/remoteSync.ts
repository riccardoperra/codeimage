import {
  concatMap,
  debounceTime,
  EMPTY,
  filter,
  from,
  groupBy,
  map,
  mergeMap,
  type Observable,
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
    map(state => ({state, id: project.id()})),
    filter(change => !!change.id && project.loggedIn() && !project.readOnly()),
    groupBy(change => change.id),
    mergeMap(changes =>
      changes.pipe(
        debounceTime(150),
        tap(({id}) => {
          if (project.id() === id) setPending(true);
        }),
        debounceTime(3000),
        tap(({id}) => {
          if (project.id() === id) setPending(false);
        }),
        concatMap(({id, state}) => (id ? from(save(id, state)) : EMPTY)),
      ),
    ),
  );
}
