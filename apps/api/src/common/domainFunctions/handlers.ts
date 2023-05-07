import {
  ComposeHandlers,
  Handler,
  HandlerCallbackMetadata,
  MergeHandlerDependencies,
  Wrap,
} from '@api/domain';
import {HandlerBuilder} from './builder.js';
import {HandlerRegistry} from './registry.js';

export const $HANDLER: unique symbol = Symbol('handler-metadata');

interface HandlerMetadata {
  name: string;
}

export function getHandlerMetadata(handler: object): HandlerMetadata {
  const metadata = Reflect.get(handler, $HANDLER);
  if (!metadata) {
    throw new Error('Given object is not a valid handler');
  }
  return metadata;
}

export function createModuleHandlers<
  TDependencies extends Record<string, any>,
>() {
  const builder = HandlerBuilder.withDependencies<TDependencies>();
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
    return builder.withName(name).withImplementation(handlerCallback).build();
  };
}

export function registerHandlers<S extends readonly Handler<string, any>[]>(
  handlers: readonly [...S],
  dependencies: MergeHandlerDependencies<S>,
  registry: HandlerRegistry,
): Wrap<ComposeHandlers<S>> {
  return Object.fromEntries(
    handlers.map((handler: Handler<string>) => {
      const metadata = getHandlerMetadata(handler);
      const handlerCallback = Object.assign(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (...args: any[]) =>
          handler(dependencies, {handlers: registry.handlers})(...args),
        {
          [$HANDLER]: metadata,
        },
      );
      registry.add(handlerCallback);
      return [metadata.name, handlerCallback] as const;
    }),
  ) as Wrap<ComposeHandlers<S>>;
}
