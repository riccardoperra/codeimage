import {
  $HANDLER,
  DomainHandlerMap,
  GenericHandler,
  HandlerCallback,
  Lazy,
} from '@api/domain';

export class HandlerRegistry {
  #events = new Map<string, Lazy<GenericHandler>>();

  get handlers(): DomainHandlerMap {
    return Object.fromEntries(
      this.#events.entries(),
    ) as unknown as DomainHandlerMap;
  }

  add<THandlerDependencies>(
    handler: HandlerCallback<THandlerDependencies>,
    dependencies: THandlerDependencies,
  ): void {
    const metadata = handler[$HANDLER];
    if (!metadata) {
      throw new Error('Given object is not a valid handler');
    }

    this.#events.set(metadata.name, () => handler(dependencies, this.handlers));
  }
}
