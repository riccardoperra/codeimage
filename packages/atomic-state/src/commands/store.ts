import {map, Subject} from 'rxjs';
import {Accessor, batch, createMemo, untrack} from 'solid-js';
import {createStore, SetStoreFunction} from 'solid-js/store';
import {createDerivedSetter} from '../createDerivedSetter';
import {
  CommandIdentity,
  CommandPayload,
  createCommand,
  ExecutedGenericStateCommand,
  GenericStateCommand,
} from './command';

const $updateCallbackReturn = Symbol('$updateCallbackReturn');

type ExecuteCommandCallback<T, Command extends GenericStateCommand> = (
  payload: CommandPayload<Command>,
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
}

export function createStoreContainer<TState>(
  initialState: TState,
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
            const result = callback(store.data, command.meta.consumerValue, {
              $update: $update as unknown as (
                ...args: Parameters<SetStoreFunction<TState>>
              ) => typeof $updateCallbackReturn,
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
    get: state,
    set: createDerivedSetter(store, ['data']),
    commands: {},
    on(command, executeFn): StoreContainer<TState, any> {
      const callbacks = commandsCallbackMap.get(command.meta.identity) ?? [];
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
  };
}
