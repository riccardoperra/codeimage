import {filter, map, Observable, Subject} from 'rxjs';
import {Accessor, batch, createMemo, untrack} from 'solid-js';
import {reconcile, SetStoreFunction} from 'solid-js/store';
import {createDerivedSetter} from '../createDerivedSetter';
import {createStore} from '../createStore';
import {createTrackObserver} from '../createTrackObserver';
import {
  CommandIdentity,
  CommandPayload,
  createCommand,
  ExecutedGenericStateCommand,
  GenericStateCommand,
  mapCommandsToActions,
  MapCommandToActions,
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
  readonly actions: MapCommandToActions<Commands>;

  watchCommand<Commands extends GenericStateCommand[]>(
    commands?: Commands,
  ): Observable<Commands[number]>;
}

export const [track, untrackCommand] = createTrackObserver();

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
    .pipe(filter(([command]) => !command.meta.identity.endsWith('@Done')))
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

        const doneCommand = createCommand(
          `${command.meta.identity}@Done`,
        ).withPayload<{
          source: GenericStateCommand;
          payload: unknown;
          state: TState;
        }>();

        commandsSubject$.next(
          Object.assign(doneCommand, {
            meta: Object.assign(doneCommand.meta, {
              consumerValue: {
                source: command,
                payload: command.meta.consumerValue,
                state: store.data,
              },
            }),
          }),
        );
      });
    });

  const commands: Record<string, GenericStateCommand> = {};

  const state = createMemo(() => store.data);

  return {
    get: state,
    set: createDerivedSetter(store, ['data']) as SetStoreFunction<TState>,
    commands,
    get actions() {
      return mapCommandsToActions(this.dispatch, commands);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const resolvedCommand = !track() ? command.silent() : command;
        commandsSubject$.next(resolvedCommand.execute(payload));
      }
    },
    watchCommand<Commands extends GenericStateCommand>(commands?: Commands[]) {
      return (commandsSubject$ as Observable<Commands>).pipe(
        filter(command => {
          return !!(commands ?? []).find(
            x => x.meta.identity === command.meta.identity && !x.meta.silent,
          );
        }),
      );
    },
  };
}
