declare module '@api/domain' {
  export type HandlersMap<TDependencies> = Record<
    string,
    HandlerCallback<TDependencies>
  >;

  type GenericHandler = (...args: any[]) => any;

  type Wrap<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;

  type HandlerCallback<TDependencies = any> = (
    dependencies: TDependencies,
  ) => GenericHandler;

  type ResolveHandler<THandler extends HandlerCallback<any>> =
    THandler extends (dependencies: any) => infer TCallback ? TCallback : never;

  type ResolvedHandlersMap<
    TDependencies,
    TMap extends HandlersMap<TDependencies>,
  > = {
    [K in keyof TMap]: ResolveHandler<TMap[K]>;
  };

  type HandlersOf<TMap extends HandlersMap<any>> = Wrap<{
    [K in keyof TMap]: TMap[K] extends (dependencies: any) => infer TCallback
      ? TCallback
      : never;
  }>;

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DomainHandler {}
}
