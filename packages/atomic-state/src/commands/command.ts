export interface StateCommand<Identity extends string, T> {
  withPayload<TPayload>(): StateCommand<
    Identity,
    unknown extends T ? TPayload : T | TPayload
  >;

  meta: {
    identity: string;
    silent: false;
  };

  execute<TValue extends T>(
    payload: TValue,
  ): ExecutedStateCommand<Identity, TValue>;

  silent(): SilentCommand<StateCommand<Identity, T>>;
}

export type ExecutedStateCommand<Identity extends string, T> = Readonly<
  Omit<StateCommand<Identity, T>, 'withPayload' | 'execute'> & {
    meta: {consumerValue: T};
  }
>;

type SilentCommand<Command extends GenericStateCommand> = Command & {
  meta: {
    silent: true;
  };
};

export type GenericStateCommand = StateCommand<string, unknown>;
export type ExecutedGenericStateCommand = ExecutedStateCommand<string, unknown>;

type GetCommandInfo<T extends GenericStateCommand> = T extends StateCommand<
  infer TIdentity,
  infer TPayload
>
  ? {identity: TIdentity; payload: TPayload}
  : never;

export type CommandIdentity<T extends GenericStateCommand> =
  GetCommandInfo<T>['identity'];

export type CommandPayload<T extends GenericStateCommand> =
  GetCommandInfo<T>['payload'];

export function createCommand<Identity extends string, T = unknown>(
  identity: Identity,
): StateCommand<Identity, T> {
  return {
    withPayload() {
      return this;
    },
    meta: {
      identity,
      silent: false,
    },
    silent(): SilentCommand<StateCommand<Identity, T>> {
      return Object.assign(this, {
        meta: Object.assign(this.meta, {silent: true as const}),
      });
    },
    execute<TValue extends T>(
      payload: TValue,
    ): ExecutedStateCommand<Identity, TValue> {
      return Object.assign(this, {
        meta: Object.assign(this.meta, {consumerValue: payload}),
      });
    },
  };
}

export type MapCommandToActions<T extends Record<string, GenericStateCommand>> =
  {
    [K in keyof T]: (
      payload: CommandPayload<T[K] & GenericStateCommand>,
    ) => void;
  };

export function mapCommandsToActions<
  T extends Record<string, GenericStateCommand>,
>(
  dispatcher: (
    command: GenericStateCommand,
    payload: CommandPayload<GenericStateCommand>,
  ) => void,
  commands: T,
): MapCommandToActions<T> {
  return Object.fromEntries(
    Object.entries(commands).map(([k, command]) => {
      return [k, (payload: unknown) => dispatcher(command, payload)] as const;
    }),
  ) as MapCommandToActions<T>;
}
