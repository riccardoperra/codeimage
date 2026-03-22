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
    handlers: ResolvedDomainHandlerMap<DomainHandlerMap>;
  };

  type Handler<
    HandlerName extends string,
    THandlerInternals extends HandlerInternalMetadata = HandlerInternalMetadata,
  > = ((
    dependencies: THandlerInternals['dependencies'],
    metadata: HandlerCallbackMetadata,
  ) => (...args: THandlerInternals['input']) => THandlerInternals['output']) & {
    [$HANDLER]: {name: HandlerName};
  };

  type MergeHandlerDependencies<
    THandlers extends readonly Handler<string, any>[],
    Accumulator extends Record<string, any> = {},
  > = THandlers extends [infer InferredHandler, ...infer RestHandlers]
    ? InferredHandler extends Handler<any, infer HandlerMetadata>
      ? MergeHandlerDependencies<
          RestHandlers,
          Accumulator & HandlerMetadata['dependencies']
        >
      : Accumulator
    : Accumulator;

  type ComposeHandlers<THandlers extends readonly Handler<any, any>[]> = Wrap<{
    [K in keyof THandlers & string as THandlers[K] extends Handler<infer R, any>
      ? R
      : never]: THandlers[K] extends Handler<any, infer HandlerMetadata>
      ? (...args: HandlerMetadata['input']) => HandlerMetadata['output']
      : never;
  }>;

  type ResolvedDomainHandlerMap<T extends object> = {
    [K in keyof T]: T[K] extends Handler<string, infer R>
      ? (...args: R['input']) => R['output']
      : never;
  };

  type Wrap<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DomainHandlerMap {}
}
