declare module '@api/domain' {
  export type HandlersMap<TDependencies> = Record<
    string,
    HandlerCallback<TDependencies>
  >;

  type GenericHandler = (...args: any[]) => any;

  type Wrap<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;

  type HandlerCallback<TDependencies = any> = (
    dependencies: TDependencies,
    events: any,
  ) => GenericHandler;

  type ResolveHandlerMap<TMap extends HandlersMap<TDependencies>> =
    StrictResolvedHandlersMap<any, TMap>;

  type ResolveHandler<THandler extends HandlerCallback<any>> =
    THandler extends (dependencies: any) => infer TCallback ? TCallback : never;

  type StrictResolvedHandlersMap<
    TDependencies,
    TMap extends HandlersMap<TDependencies>,
  > = {
    [K in keyof TMap]: ResolveHandler<TMap[K]>;
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DomainHandler {}
}
