import {filter, Observable} from 'rxjs';
import {Store} from '../store';
import {
  CommandPayload,
  createCommand,
  GenericStateCommand,
  MapCommandToActions,
  StateCommand,
} from './command';
import {makeCommandNotifier} from './notifier';

type GenericCommandsMap = Record<PropertyKey, GenericStateCommand>;

type ExecuteCommandCallback<T, Command extends GenericStateCommand> = (
  payload: CommandPayload<Command>,
  state: T,
) => T;

interface StoreWithProxyCommands<
  T,
  Commands extends Record<
    PropertyKey,
    GenericStateCommand
  > = GenericCommandsMap,
> {
  hold<Command extends GenericStateCommand>(
    command: Command,
    callback: ExecuteCommandCallback<T, Command>,
  ): void;

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

type ProxifyCommands<T extends Record<string, unknown>> = {
  [K in keyof T]: StateCommand<K & string, T[K]>;
};

function plugin<ActionsMap extends Record<string, unknown>>(): <TState>(
  ctx: Store<TState>,
) => StoreWithProxyCommands<TState, ProxifyCommands<ActionsMap>> {
  type ProxifiedCommands = ProxifyCommands<ActionsMap>;

  return <T>(ctx: Store<T>) => {
    const {commandsSubject$, callbacks, track} = makeCommandNotifier(ctx);

    function commandsProxyHandler(): ProxyHandler<ProxifiedCommands> {
      const commandsMap: Record<string, GenericStateCommand> = {};
      return {
        get(_, property: string) {
          if (!commandsMap[property]) {
            commandsMap[property] = createCommand(property).withPayload();
          }
          return commandsMap[property];
        },
      };
    }

    function dispatch(
      command: GenericStateCommand,
      payload: CommandPayload<GenericStateCommand>,
    ) {
      const resolvedCommand = !track()
        ? command.with({silent: true as const})
        : command;
      commandsSubject$.next(resolvedCommand.execute(payload));
    }

    const commands = new Proxy({} as ProxifiedCommands, commandsProxyHandler());

    function actionsProxyHandler(): ProxyHandler<
      MapCommandToActions<ProxifiedCommands>
    > {
      const actions: MapCommandToActions<GenericCommandsMap> = {};

      return {
        get(_, property: string) {
          const command = commands[
            property as keyof typeof commands
          ] as unknown as GenericStateCommand;
          if (!actions[property]) {
            actions[property] = payload => dispatch(command, payload);
          }
          return actions[property];
        },
      };
    }

    return {
      commands,
      actions: new Proxy(
        {} as MapCommandToActions<ProxifiedCommands>,
        actionsProxyHandler(),
      ),
      dispatch(command, payload) {
        const resolvedCommand = !track()
          ? command.with({silent: true as const})
          : command;
        commandsSubject$.next(resolvedCommand.execute(payload));
      },
      hold(command, cb) {
        const resolvedCallbacks = callbacks.get(command.meta.identity) || [];
        const updatedCallbacks = resolvedCallbacks.concat(
          cb as unknown as ExecuteCommandCallback<T, GenericStateCommand>,
        );
        callbacks.set(command.meta.identity, updatedCallbacks);
      },
      watchCommand<Commands extends GenericStateCommand>(
        commands?: Commands[],
      ) {
        return (commandsSubject$ as Observable<Commands>).pipe(
          filter(command => {
            return !!(commands ?? []).find(
              x =>
                x.meta.identity === command.meta.identity &&
                !(x.meta as any).silent,
            );
          }),
        );
      },
    };
  };
}

export function withProxyCommands<T extends Record<string, unknown>>() {
  return <S>(ctx: Store<S>) => {
    return plugin<T>()(ctx);
  };
}
