import {Observable} from 'rxjs';
import {Store, StoreValue} from 'statesolid';
import {
  CommandPayload,
  createCommand,
  GenericStateCommand,
  MapCommandToActions,
  StateCommand,
} from './command';
import {ExecuteCommandCallback, makeCommandNotifier} from './notifier';

type GenericCommandsMap = Record<PropertyKey, GenericStateCommand>;

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
  ): this;

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

function plugin<ActionsMap extends Record<string, unknown>>(): <
  TState extends StoreValue,
>(
  ctx: Store<TState>,
) => StoreWithProxyCommands<TState, ProxifyCommands<ActionsMap>> {
  type ProxifiedCommands = ProxifyCommands<ActionsMap>;

  return <T extends StoreValue>(ctx: Store<T>) => {
    const {commandsSubject$, callbacks, track, watchCommand} =
      makeCommandNotifier(ctx);

    function commandsProxyHandler(): ProxyHandler<ProxifiedCommands> {
      const commandsMap: Record<string, GenericStateCommand> = {};
      return {
        ownKeys() {
          return Reflect.ownKeys(actions);
        },
        getOwnPropertyDescriptor(target, key) {
          return {
            value: Reflect.get(commands, key),
            enumerable: true,
            configurable: true,
          };
        },
        get(_, property: string) {
          if (!commandsMap[property]) {
            commandsMap[property] = createCommand(property).withPayload();
            actions[property];
          }
          return commandsMap[property];
        },
      };
    }

    function actionsProxyHandler(): ProxyHandler<
      MapCommandToActions<ProxifiedCommands>
    > {
      const actions: MapCommandToActions<GenericCommandsMap> = {};

      return {
        ownKeys() {
          return Reflect.ownKeys(actions);
        },
        getOwnPropertyDescriptor(target, key) {
          return {
            value: Reflect.get(actions, key),
            enumerable: true,
            configurable: true,
          };
        },
        get(_, property: string) {
          const command = commands[
            property as keyof typeof commands
          ] as unknown as GenericStateCommand;
          if (!actions[property]) {
            actions[property] = payload => {
              dispatch(command, payload);
            };
          }
          return actions[property];
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

    const actions = new Proxy(
      {} as MapCommandToActions<ProxifiedCommands>,
      actionsProxyHandler(),
    );

    return {
      commands,
      actions,
      hold(command, cb) {
        const resolvedCallbacks = callbacks.get(command.meta.identity) || [];
        const updatedCallbacks = resolvedCallbacks.concat(
          cb as unknown as ExecuteCommandCallback<T, GenericStateCommand>,
        );
        callbacks.set(command.meta.identity, updatedCallbacks);
        return this;
      },
      dispatch,
      watchCommand,
    };
  };
}

export function withProxyCommands<T extends Record<string, unknown>>() {
  return <S extends StoreValue>(ctx: Store<S>) => {
    return plugin<T>()(ctx);
  };
}
