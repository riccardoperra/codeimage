import {
  DomainHandler,
  HandlerCallback,
  HandlersMap,
  StrictResolvedHandlersMap,
  Wrap,
} from '@api/domain';
import {EventRegistry} from './eventRegistry';

const $HANDLER = Symbol('domain-handler');

type HandlerMetadata = {
  registry: DomainHandlerRegistry;
  name?: string;
};

export class DomainHandlerRegistry<TDependencies = unknown> {
  // @ts-ignore
  #moduleName: string | null = null;
  #dependencies: TDependencies | null = null;

  get dependencies() {
    return this.#dependencies;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected constructor(moduleName?: string) {
    this.#moduleName = moduleName ?? null;
  }

  static forModule<T>() {
    return new DomainHandlerRegistry<T>();
  }

  resolveHandlers = <THandlers extends HandlersMap<TDependencies>>(
    handlers: THandlers,
    dependencies: TDependencies,
    eventRegistry: EventRegistry,
  ): Wrap<StrictResolvedHandlersMap<TDependencies, THandlers>> => {
    return Object.fromEntries(
      Object.entries(handlers).map(
        ([key, fn]) =>
          [key, this.#resolve(fn, dependencies, eventRegistry)] as const,
      ),
    ) as Wrap<StrictResolvedHandlersMap<TDependencies, THandlers>>;
  };

  createHandler = <Callback extends (...args: any[]) => unknown>(
    callback: (dependencies: TDependencies, events: DomainHandler) => Callback,
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
    const handler = this.createHandler(callback);
    const metadata = Reflect.get(handler, $HANDLER) as HandlerMetadata;
    metadata.name = name;
    return callback;
  };

  #resolve = (
    handler: HandlerCallback<TDependencies>,
    dependencies: TDependencies,
    eventRegistry: EventRegistry,
  ) => {
    if (!Reflect.has(handler, $HANDLER)) {
      throw new Error('Given object is not a valid handler');
    }

    const metadata = Reflect.get(handler, $HANDLER) as HandlerMetadata;
    if (metadata.name) {
      eventRegistry.add(handler, dependencies);
    }

    return handler(dependencies, eventRegistry.events);
  };
}
