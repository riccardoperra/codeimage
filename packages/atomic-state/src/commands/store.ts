import {map, Subject} from 'rxjs';
import {batch, createMemo, untrack} from 'solid-js';
import {createStore, SetStoreFunction} from 'solid-js/store';
import {
  CommandPayload,
  ExecutedGenericStateCommand,
  GenericStateCommand,
} from './command';

const $updateCallbackReturn = Symbol('$updateCallbackReturn');

type ExecuteCommandCallback<T, Command extends GenericStateCommand> = (
  state: T,
  payload: CommandPayload<Command>,
  meta: {
    $update: SetStoreFunction<T>;
  },
) => T | typeof $updateCallbackReturn;

interface StoreContainer<T> {
  state(): T;

  on<Command extends GenericStateCommand>(
    command: Command,
    executeFn: ExecuteCommandCallback<T, Command>,
  ): StoreContainer<T>;

  dispatch<Command extends GenericStateCommand>(
    command: Command,
    payload: CommandPayload<Command>,
  ): void;
}

export function createStoreContainer<TState>(
  initialState: TState,
): StoreContainer<TState> {
  const [store, setStore] = createStore<{
    data: TState;
  }>({
    data: initialState,
  });

  const commandsSubject$ = new Subject<ExecutedGenericStateCommand>();

  const commandsCallbackMap = new Map<
    string,
    ReadonlyArray<ExecuteCommandCallback<TState, GenericStateCommand>>
  >();

  commandsSubject$
    .pipe(
      map(command => {
        const callbacks = commandsCallbackMap.get(command.meta.identity) ?? [];
        return [command, callbacks] as const;
      }),
    )
    .subscribe(([command, callbacks]) => {
      batch(() => {
        for (const callback of callbacks) {
          untrack(() => {
            const $update: SetStoreFunction<TState> = (...args: unknown[]) => {
              (setStore as (...args: unknown[]) => void)('data', ...args);
              return $updateCallbackReturn;
            };
            const result = callback(store.data, command.meta.consumerValue, {
              $update,
            });
            if (result === $updateCallbackReturn) {
              return;
            }
            setStore('data', result);
          });
        }
      });
    });

  const state = createMemo(() => store.data);
  return {
    state,
    on(command, executeFn): StoreContainer<TState> {
      const callbacks = commandsCallbackMap.get(command.meta.identity) ?? [];
      commandsCallbackMap.set(
        command.meta.identity,
        callbacks.concat(executeFn),
      );
      return this;
    },
    dispatch(command, payload) {
      commandsSubject$.next(command.execute(payload));
    },
  };
}
