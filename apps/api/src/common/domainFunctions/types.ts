export type HandlersMap<TDependencies> = Record<
  string,
  HandlerCallback<TDependencies>
>;

export type Wrap<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;

export type HandlerCallback<TDependencies> = (
  dependencies: TDependencies,
) => (...args: any[]) => unknown;

export type ResolvedHandlersMap<
  TDependencies,
  TMap extends HandlersMap<TDependencies>,
> = {
  [K in keyof TMap]: TMap[K] extends (
    dependencies: TDependencies,
  ) => infer TCallback
    ? TCallback
    : never;
};

export type HandlersOf<TMap extends HandlersMap<any>> = Wrap<{
  [K in keyof TMap]: TMap[K] extends (dependencies: any) => infer TCallback
    ? TCallback
    : never;
}>;
