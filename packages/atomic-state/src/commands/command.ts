export interface StateCommand<Identity extends string, T> {
  withPayload<TPayload>(): StateCommand<
    Identity,
    unknown extends T ? TPayload : T | TPayload
  >;

  meta: {
    identity: string;
  };

  execute<TValue extends T>(
    payload: TValue,
  ): ExecutedStateCommand<Identity, TValue>;
}

export type ExecutedStateCommand<Identity extends string, T> = Readonly<
  Omit<StateCommand<Identity, T>, 'withPayload' | 'execute'> & {
    meta: {consumerValue: T};
  }
>;

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
