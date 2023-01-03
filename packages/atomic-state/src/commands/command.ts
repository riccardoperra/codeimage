export interface StateCommand<
  Identity extends string,
  T,
  Async extends boolean,
> {
  withPayload<TPayload>(): StateCommand<
    Identity,
    unknown extends T ? TPayload : T | TPayload,
    Async
  >;

  async(): Omit<StateCommand<Identity, T, true>, 'async'>;

  meta: {
    identity: string;
    async: Async;
  };

  execute<TValue extends T>(
    payload: TValue,
  ): ExecutedStateCommand<Identity, TValue, Async>;
}

export type ExecutedStateCommand<
  Identity extends string,
  T,
  Async extends boolean,
> = Readonly<
  Omit<StateCommand<Identity, T, Async>, 'withPayload' | 'execute'> & {
    meta: {consumerValue: T};
  }
>;

export type GenericStateCommand = StateCommand<string, unknown, boolean>;
export type ExecutedGenericStateCommand = ExecutedStateCommand<
  string,
  unknown,
  boolean
>;

type GetCommandInfo<T extends GenericStateCommand> = T extends StateCommand<
  infer TIdentity,
  infer TPayload,
  infer TAsync
>
  ? {identity: TIdentity; payload: TPayload; async: TAsync}
  : never;

export type CommandIdentity<T extends GenericStateCommand> =
  GetCommandInfo<T>['identity'];

export type CommandPayload<T extends GenericStateCommand> =
  GetCommandInfo<T>['payload'];

export function createCommand<Identity extends string, T = unknown>(
  identity: Identity,
): StateCommand<Identity, T, boolean> {
  return {
    withPayload() {
      return this;
    },
    meta: {
      identity,
      async: false,
    },
    async(): StateCommand<Identity, T, true> {
      this.meta.async = true;
      return this as StateCommand<Identity, T, true>;
    },
    execute<TValue extends T>(
      payload: TValue,
    ): ExecutedStateCommand<Identity, TValue, boolean> {
      return Object.assign(this, {
        meta: Object.assign(this.meta, {consumerValue: payload}),
      });
    },
  };
}

type Indices<T extends readonly unknown[]> = Exclude<
  Partial<T>['length'],
  T['length']
>;

// type ExtractCommandFromIndex<
//   I extends number,
//   Commands extends GenericStateCommand[],
// > = CommandIdentity<Commands[I]>;
//
// export function mapCommandsToActions<T extends GenericStateCommand[]>(
//   dispatcher: <TCommand extends GenericStateCommand>(
//     command: TCommand,
//     payload: CommandPayload<TCommand>,
//   ) => void,
//   commands: [...T],
// ): {
//   [K in Indices<T> as ExtractCommandFromIndex<K & number, T> & string]: (
//     p: CommandPayload<T[K & number]>,
//   ) => void;
// } {
//   return Object.fromEntries(
//     commands.map(
//       command =>
//         [
//           command.meta.identity,
//           (payload: any) => dispatcher(command, payload),
//         ] as const,
//     ),
//   ) as any;
// }

type ExtractCommandFromIndex<
  I extends number,
  Commands extends GenericStateCommand[],
> = CommandIdentity<Commands[I]>;

export function mapCommandsToActions<
  T extends Record<string, StateCommand<any, any, any>>,
>(
  dispatcher: (
    command: StateCommand<any, any, any>,
    payload: CommandPayload<StateCommand<any, any, any>>,
  ) => void,
  commands: T,
): {
  [K in keyof T]: (payload: CommandPayload<T[K] & GenericStateCommand>) => void;
} {
  return Object.fromEntries(
    Object.entries(commands).map(([k, command]) => {
      return [k, (payload: any) => dispatcher(command, payload)] as const;
    }),
  ) as any;
}
