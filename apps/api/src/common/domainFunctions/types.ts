export type HandlersMap<TDependencies> = Record<
  string,
  HandlerCallback<TDependencies>
>;

export type GenericHandler = (...args: any[]) => any;

export type Wrap<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;

export type HandlerCallback<TDependencies = any> = (
  dependencies: TDependencies,
) => GenericHandler;

export type ResolveHandler<THandler extends HandlerCallback<any>> =
  THandler extends (dependencies: any) => infer TCallback ? TCallback : never;

export type ResolvedHandlersMap<
  TDependencies,
  TMap extends HandlersMap<TDependencies>,
> = {
  [K in keyof TMap]: ResolveHandler<TMap[K]>;
};

export type HandlersOf<TMap extends HandlersMap<any>> = Wrap<{
  [K in keyof TMap]: TMap[K] extends (dependencies: any) => infer TCallback
    ? TCallback
    : never;
}>;
