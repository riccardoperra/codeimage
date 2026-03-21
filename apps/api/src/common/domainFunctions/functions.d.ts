/* eslint-disable @typescript-eslint/ban-types */

declare const $HANDLER: unique symbol;

declare module '@api/domain' {
  type GenericHandler = (...args: unknown[]) => unknown;

  type HandlerInternalMetadata = {
    dependencies: unknown;
    input: unknown[];
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
    THandlers extends readonly Handler<string, HandlerInternalMetadata>[],
    Accumulator extends Record<string, unknown> = Record<string, never>,
  > = THandlers extends [infer InferredHandler, ...infer RestHandlers]
    ? InferredHandler extends Handler<string, infer HandlerMetadata>
      ? MergeHandlerDependencies<
          RestHandlers,
          Accumulator & HandlerMetadata['dependencies']
        >
      : Accumulator
    : Accumulator;

  type ComposeHandlers<
    THandlers extends readonly Handler<string, HandlerInternalMetadata>[],
  > = Wrap<{
    [K in keyof THandlers & string as THandlers[K] extends Handler<
      infer R,
      HandlerInternalMetadata
    >
      ? R
      : never]: THandlers[K] extends Handler<string, infer HandlerMetadata>
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
  interface DomainHandlerMap {
    __domainHandlerMapBrand?: never;
  }
}
