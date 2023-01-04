import {Observable} from 'rxjs';
import {Store} from '../store';
import {
  CommandIdentity,
  CommandPayload,
  GenericStateCommand,
  MapCommandToActions,
} from './command';
import {makeCommandNotifier} from './notifier';

type ExecuteCommandCallback<T, Command extends GenericStateCommand> = (
  payload: CommandPayload<Command>,
  state: T,
) => T;

type GenericCommandsMap = Record<PropertyKey, GenericStateCommand>;

interface StoreWithCommands<
  T,
  Commands extends Record<
    PropertyKey,
    GenericStateCommand
  > = GenericCommandsMap,
> {
  on<
    Command extends GenericStateCommand,
    TCommandName extends CommandIdentity<Command>,
  >(
    command: Command,
    executeFn: ExecuteCommandCallback<T, Command>,
  ): this & StoreWithCommands<T, Commands & {[key in TCommandName]: Command}>;

  dispatch<Command extends GenericStateCommand>(
    command: Command,
    payload: CommandPayload<Command>,
  ): void;

  readonly commands: Commands;
  readonly actions: MapCommandToActions<Commands>;

  watchCommand<Commands extends GenericStateCommand[]>(
    commands?: Commands,
  ): Observable<Commands[number]>;
}

function plugin<T>(ctx: Store<T>): StoreWithCommands<T> {
  const {
    callbacks: commandsCallbackMap,
    dispatch,
    watchCommand,
  } = makeCommandNotifier(ctx);

  const commands: Record<string, GenericStateCommand> = {};
  const actions: MapCommandToActions<GenericCommandsMap> = {};

  return {
    commands,
    actions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on<
      Command extends GenericStateCommand,
      TCommandName extends CommandIdentity<Command>,
    >(
      command: Command,
      executeFn: ExecuteCommandCallback<T, Command>,
    ): StoreWithCommands<
      T,
      GenericCommandsMap & {[key in TCommandName]: Command}
    > {
      const callbacks = commandsCallbackMap.get(command.meta.identity) ?? [];
      commands[command.meta.identity] = command;
      commandsCallbackMap.set(
        command.meta.identity,
        callbacks.concat(executeFn),
      );
      actions[command.meta.identity] = payload => {
        this.dispatch(command, payload);
      };

      return Object.assign(ctx, this) as Store<T> &
        StoreWithCommands<
          T,
          GenericCommandsMap & {[key in TCommandName]: Command}
        >;
    },
    dispatch,
    watchCommand,
  };
}

export const withFluentCommands =
  () =>
  <S>(ctx: Store<S>) =>
    plugin(ctx);
