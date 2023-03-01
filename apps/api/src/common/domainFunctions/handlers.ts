import {
  $HANDLER,
  ComposeHandlers,
  DomainHandlerMap,
  GenericHandlerDependencies,
  Handler,
  MergeHandlerDependencies,
  Wrap,
} from '@api/domain';
import {HandlerRegistry} from './registry';

export function createModuleHandlers<
  TDependencies extends GenericHandlerDependencies,
>() {
  return <THandlerName extends string, R extends (...args: any[]) => any>(
    name: THandlerName,
    handlerCallback: (
      dependencies: TDependencies,
      handler: DomainHandlerMap,
    ) => R,
  ): Handler<
    THandlerName,
    {
      dependencies: TDependencies;
      input: Parameters<R>;
      output: ReturnType<R>;
    }
  > => {
    Object.defineProperty(handlerCallback, $HANDLER, {value: name});
    return Object.assign(handlerCallback, {
      [$HANDLER]: {name},
    }) as Handler<THandlerName, any>;
  };
}

export function registerHandlers<S extends Handler<string, any>[]>(
  handlers: [...S],
  dependencies: Wrap<MergeHandlerDependencies<S>>,
  registry: HandlerRegistry,
): Wrap<ComposeHandlers<S>> {
  return Object.fromEntries(
    handlers.map((handler: Handler<string, any>) => {
      return [
        handler[$HANDLER].name,
        handler(dependencies, {
          get handlers() {
            return registry.handlers;
          },
        }),
      ] as const;
    }),
  ) as Wrap<ComposeHandlers<S>>;
}
