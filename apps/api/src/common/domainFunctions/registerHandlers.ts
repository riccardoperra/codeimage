import {
  HandlerCallback,
  HandlersMap,
  ResolvedHandlersMap,
  ResolveHandler,
  Wrap,
} from './types';

const $HANDLER = Symbol('domain-handler');

type HandlerMetadata = {
  registry: DomainHandlerRegistry<any>;
};

export class DomainHandlerRegistry<TDependencies> {
  #dependencies: TDependencies | null = null;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  get dependencies(): TDependencies | null {
    return this.#dependencies;
  }

  static domain<T>() {
    return new DomainHandlerRegistry<T>();
  }

  static inject<THandler extends HandlerCallback>(
    handler: THandler,
  ): ResolveHandler<THandler> {
    if (!Reflect.has(handler, $HANDLER)) {
      throw new Error('Cannot inject handler in current scope');
    }

    const metadata = Reflect.get(handler, $HANDLER) as HandlerMetadata;

    if (!metadata.registry.dependencies) {
      throw new Error('Cannot inject handler dependency in current scope');
    }

    return handler(metadata.registry.dependencies) as ResolveHandler<THandler>;
  }

  prepareHandlers<THandlers extends HandlersMap<TDependencies>>(
    handlers: THandlers,
  ): (
    dependencies: TDependencies,
  ) => Wrap<ResolvedHandlersMap<TDependencies, THandlers>> {
    return (dependencies: TDependencies) => {
      this.#dependencies = dependencies;
      return this.resolveHandlers(handlers, dependencies);
    };
  }

  resolveHandlers<THandlers extends HandlersMap<TDependencies>>(
    handlers: THandlers,
    dependencies: TDependencies,
  ): Wrap<ResolvedHandlersMap<TDependencies, THandlers>> {
    return Object.fromEntries(
      Object.entries(handlers).map(
        ([key, fn]) => [key, this.#resolve(fn, dependencies)] as const,
      ),
    ) as Wrap<ResolvedHandlersMap<TDependencies, THandlers>>;
  }

  createHandler<Callback extends (...args: any[]) => unknown>(
    callback: (dependencies: TDependencies) => Callback,
  ) {
    Object.defineProperty(callback, $HANDLER, {
      value: {
        registry: this,
      } as HandlerMetadata,
    });
    return callback;
  }

  #resolve(
    handler: HandlerCallback<TDependencies>,
    dependencies: TDependencies,
  ) {
    if (!Reflect.has(handler, $HANDLER)) {
      throw new Error('Given object is not a valid handler');
    }
    return handler(dependencies);
  }
}
