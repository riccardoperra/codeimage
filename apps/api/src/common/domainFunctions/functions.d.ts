/* eslint-disable @typescript-eslint/no-explicit-any */

const $$Handler = Symbol('handler');

declare module '@api/domain' {
  interface HandlerMetadata {
    name: string;
  }

  type GenericHandler = (...args: any[]) => any;

  type HandlerInternalData = {
    dependencies: unknown;
    input: unknown;
    output: unknown;
  };

  type HandlerCallbackMetadata = {
    handlers: DomainHandlerMap;
  };

  type Handler<
    HandlerName extends string,
    THandlerInternals extends HandlerInternalData,
  > = ((
    dependencies: THandlerInternals['dependencies'],
    metadata: HandlerCallbackMetadata,
  ) => Return) & {
    [$$Handler]: {name: HandlerName};
  };

  type MergeHandlerDependencies<
    H extends Handler<string, any>[],
    // eslint-disable-next-line @typescript-eslint/ban-types
    Acc extends Record<string, any> = {},
  > = H extends [infer LH, ...infer RH]
    ? LH extends Handler<any, infer D>
      ? Acc & MergeHandlerDependencies<RH, D['dependencies']>
      : Acc
    : Acc;

  type ComposeHandlers<
    H extends Handler<string, any>[],
    // eslint-disable-next-line @typescript-eslint/ban-types
    Acc extends Record<string, any> = {},
  > = H extends [infer LH, ...infer RH]
    ? LH extends Handler<infer S, infer D>
      ? Acc &
          ComposeHandlers<
            RH,
            {
              [key in S]: (...args: D['input']) => D['output'];
            }
          >
      : Acc
    : Acc;

  type ResolvedDomainHandlerMap<T extends object> = {
    [K in keyof T]: T[K] extends Handler<string, infer R>
      ? (...args: R['input']) => R['output']
      : never;
  };

  type Wrap<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DomainHandlerMap {}
}
