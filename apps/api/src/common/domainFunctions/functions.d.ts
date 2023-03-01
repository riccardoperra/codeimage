/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/ban-types */

const $HANDLER: unique symbol = Symbol('handler');

declare module '@api/domain' {
  type GenericHandler = (...args: any[]) => any;

  type HandlerInternalMetadata = {
    dependencies: unknown;
    input: any[];
    output: unknown;
  };

  type HandlerCallbackMetadata = {
    handlers: DomainHandlerMap;
  };

  type Handler<
    HandlerName extends string,
    THandlerInternals extends HandlerInternalMetadata,
  > = (<TReturn>(
    dependencies: THandlerInternals['dependencies'],
    metadata: HandlerCallbackMetadata,
  ) => TReturn) & {
    [$HANDLER]: {name: HandlerName};
  };

  type MergeHandlerDependencies<
    THandlers extends Handler<string, any>[],
    Accumulator extends Record<string, any> = {},
  > = THandlers extends [infer InferredHandler, ...infer RestHandlers]
    ? InferredHandler extends Handler<any, infer HandlerMetadata>
      ? MergeHandlerDependencies<
          RestHandlers & Handler<string, any>[],
          Accumulator & HandlerMetadata['dependencies']
        >
      : Accumulator
    : Accumulator;

  type ComposeHandlers<
    THandlers extends Handler<string, any>[],
    Accumulator extends Record<string, any> = {},
  > = THandlers extends [infer InferredHandler, ...infer RestHandlers]
    ? InferredHandler extends Handler<infer HandlerName, infer HandlerMetadata>
      ? ComposeHandlers<
          RestHandlers & Handler<string, any>[],
          Accumulator & {
            [key in HandlerName]: (
              ...args: HandlerMetadata['input']
            ) => HandlerMetadata['output'];
          }
        >
      : Accumulator
    : Accumulator;

  type ResolvedDomainHandlerMap<T extends object> = {
    [K in keyof T]: T[K] extends Handler<string, infer R>
      ? (...args: R['input']) => R['output']
      : never;
  };

  type Wrap<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DomainHandlerMap {}
}
