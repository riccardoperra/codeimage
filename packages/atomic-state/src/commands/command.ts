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
