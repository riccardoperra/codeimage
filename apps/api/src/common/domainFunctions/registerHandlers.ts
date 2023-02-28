import {
  HandlerCallback,
  HandlersMap,
  ResolvedHandlersMap,
  ResolveHandler,
  Wrap,
} from '@api/domain';

const $HANDLER = Symbol('domain-handler');

type HandlerMetadata = {
  registry: DomainHandlerRegistry<any>;
};

export class DomainHandlerRegistry<TDependencies> {
  #dependencies: TDependencies | null = null;

  get dependencies() {
    return this.#dependencies;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  static domain<T>() {
    return new DomainHandlerRegistry<T>();
  }

  static callHandler<
    THandler extends HandlerCallback,
    TResolveHandler extends ResolveHandler<THandler> = ResolveHandler<THandler>,
  >(
    handler: THandler,
    ...args: Parameters<TResolveHandler>
  ): ReturnType<TResolveHandler> {
    if (!Reflect.has(handler, $HANDLER)) {
      throw new Error('Cannot inject handler in current scope');
    }

    const metadata = Reflect.get(handler, $HANDLER) as HandlerMetadata;

    if (!metadata.registry.dependencies) {
      throw new Error('Cannot inject handler dependency in current scope');
    }

    return handler(metadata.registry.dependencies)(
      ...args,
    ) as ReturnType<TResolveHandler>;
  }

  prepareHandlers = <THandlers extends HandlersMap<TDependencies>>(
    handlers: THandlers,
  ): ((
    dependencies: TDependencies,
  ) => Wrap<ResolvedHandlersMap<TDependencies, THandlers>>) => {
    return (dependencies: TDependencies) => {
      this.#dependencies = dependencies;
      return this.resolveHandlers(handlers, dependencies);
    };
  };

  resolveHandlers = <THandlers extends HandlersMap<TDependencies>>(
    handlers: THandlers,
    dependencies: TDependencies,
  ): Wrap<ResolvedHandlersMap<TDependencies, THandlers>> => {
    return Object.fromEntries(
      Object.entries(handlers).map(
        ([key, fn]) => [key, this.#resolve(fn, dependencies)] as const,
      ),
    ) as Wrap<ResolvedHandlersMap<TDependencies, THandlers>>;
  };

  createHandler = <Callback extends (...args: any[]) => unknown>(
    callback: (dependencies: TDependencies) => Callback,
  ) => {
    Object.defineProperty(callback, $HANDLER, {
      value: {
        registry: this,
      } as HandlerMetadata,
    });
    return callback;
  };

  createNamedHandler = <Callback extends (...args: any[]) => unknown>(
    name: string,
    callback: (dependencies: TDependencies) => Callback,
  ) => {
    Object.defineProperties(callback, {
      eventHandlerName: {value: name},
      [$HANDLER]: {
        value: {
          registry: this,
        } as HandlerMetadata,
      },
    });
    return callback;
  };

  #resolve = (
    handler: HandlerCallback<TDependencies>,
    dependencies: TDependencies,
  ) => {
    if (!Reflect.has(handler, $HANDLER)) {
      throw new Error('Given object is not a valid handler');
    }
    return handler(dependencies);
  };
}
