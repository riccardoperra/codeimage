import {filter, map, Observable, Subject} from 'rxjs';
import {Accessor, batch, createMemo, untrack} from 'solid-js';
import {reconcile, SetStoreFunction} from 'solid-js/store';
import {createDerivedSetter} from '../createDerivedSetter';
import {createStore} from '../createStore';
import {
  CommandIdentity,
  CommandPayload,
  ExecutedGenericStateCommand,
  GenericStateCommand,
} from './command';

const $updateCallbackReturn = Symbol('$updateCallbackReturn');

type ExecuteCommandCallback<T, Command extends GenericStateCommand> = (
  payload: CommandPayload<Command>,
  state: T,
  meta: {
    $update: SetStoreFunction<T>;
  },
) => T | typeof $updateCallbackReturn;

interface StoreContainer<
  T,
  Commands extends Record<PropertyKey, GenericStateCommand>,
> {
  get: Accessor<T>;
  set: SetStoreFunction<T>;

  on<
    Command extends GenericStateCommand,
    TCommandName extends CommandIdentity<Command>,
  >(
    command: Command,
    executeFn: ExecuteCommandCallback<T, Command>,
  ): StoreContainer<T, Commands & {[key in TCommandName]: Command}>;

  dispatch<Command extends GenericStateCommand | (keyof Commands & string)>(
    command: Command,
    payload: CommandPayload<
      Command extends GenericStateCommand
        ? Command
        : Commands[Command & keyof Commands]
    >,
  ): void;

  readonly commands: Commands;

  watchCommand<Commands extends GenericStateCommand[]>(
    commands?: Commands,
  ): Observable<Commands[number]>;
}

export function createStoreContainer<TState>(
  initialState: TState,
  // eslint-disable-next-line @typescript-eslint/ban-types
): StoreContainer<TState, {}> {
  const [store, setStore] = createStore<{
    data: TState;
  }>({
    data: initialState,
  });

  const commandsSubject$ = new Subject<ExecutedGenericStateCommand>();

  const commandsMap = new Map<string, GenericStateCommand>();
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
            const result = callback(command.meta.consumerValue, store.data, {
              $update: $update,
            });
            if (result === $updateCallbackReturn) {
              return;
            }
            setStore('data', reconcile(result));
          });
        }
      });
    });

  const state = createMemo(() => store.data);

  const commands: Record<string, GenericStateCommand> = {};

  return {
    get: state,
    set: createDerivedSetter(store, ['data']) as SetStoreFunction<TState>,
    commands,
    on(command, executeFn): StoreContainer<TState, any> {
      const callbacks = commandsCallbackMap.get(command.meta.identity) ?? [];
      commands[command.meta.identity] = command;
      commandsCallbackMap.set(
        command.meta.identity,
        callbacks.concat(executeFn),
      );
      return this;
    },
    dispatch(command, payload) {
      if (typeof command === 'string') {
        const resolvedCommand = commandsMap.get(command);
        if (resolvedCommand) {
          commandsSubject$.next(resolvedCommand.execute(payload));
        }
      } else {
        commandsSubject$.next(command.execute(payload));
      }
    },
    watchCommand<Commands extends GenericStateCommand>(commands?: Commands[]) {
      return (commandsSubject$ as Observable<Commands>).pipe(
        filter(command => {
          return !!(commands ?? []).find(
            x => x.meta.identity === command.meta.identity,
          );
        }),
      );
    },
  };
}
