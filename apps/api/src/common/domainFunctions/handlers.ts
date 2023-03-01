import {
  ComposeHandlers,
  GenericHandlerDependencies,
  Handler,
  HandlerCallbackMetadata,
  HandlerInternalData,
  HandlerMetadata,
  MergeHandlerDependencies,
  Wrap,
} from '@api/domain';
import {HandlerRegistry} from './registry';

export const $HANDLER = Symbol('handler');

export function getHandlerMetadata(handler: object): HandlerMetadata {
  const metadata = Reflect.get(handler, $HANDLER);
  if (!metadata) {
    throw new Error('Given object is not a valid handler');
  }
  return metadata;
}

export function createModuleHandlers<
  TDependencies extends GenericHandlerDependencies,
>() {
  return <THandlerName extends string, R extends (...args: any[]) => any>(
    name: THandlerName,
    handlerCallback: (
      dependencies: TDependencies,
      metadata: HandlerCallbackMetadata,
    ) => R,
  ): Handler<
    THandlerName,
    {
      dependencies: TDependencies;
      input: Parameters<R>;
      output: ReturnType<R>;
    }
  > => {
    return Object.assign(handlerCallback, {
      [$HANDLER]: {name},
    }) as unknown as Handler<THandlerName, any>;
  };
}

export function registerHandlers<S extends Handler<string, any>[]>(
  handlers: [...S],
  dependencies: Wrap<MergeHandlerDependencies<S>>,
  registry: HandlerRegistry,
): Wrap<ComposeHandlers<S>> {
  return Object.fromEntries(
    handlers.map((handler: Handler<string, HandlerInternalData>) => {
      const metadata = getHandlerMetadata(handler);
      const handlerCallback = Object.assign(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (...args: any[]) => {
          return handler(dependencies, {handlers: registry.handlers})(...args);
        },
        {
          [$HANDLER]: metadata,
        },
      );
      registry.add(handlerCallback);
      return [metadata.name, handlerCallback] as const;
    }),
  ) as Wrap<ComposeHandlers<S>>;
}
