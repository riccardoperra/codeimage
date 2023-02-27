import {HandlerCallback, HandlersMap, ResolvedHandlersMap, Wrap} from './types';

const $HANDLER = Symbol('domain-handler');

export class DomainHandlerRegistry<TDependencies> {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor() {}

  static domain<T>() {
    return new DomainHandlerRegistry<T>();
  }

  prepareHandlers<THandlers extends HandlersMap<TDependencies>>(
    handlers: THandlers,
  ): (
    dependencies: TDependencies,
  ) => Wrap<ResolvedHandlersMap<TDependencies, THandlers>> {
    return (dependencies: TDependencies) => {
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
    Object.defineProperty(callback, $HANDLER, {value: true});
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
