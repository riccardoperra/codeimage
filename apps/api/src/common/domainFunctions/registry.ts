import {
  DomainHandlerMap,
  GenericHandler,
  ResolvedDomainHandlerMap,
} from '@api/domain';
import {getHandlerMetadata} from './handlers';

export class HandlerRegistry<T extends object = DomainHandlerMap> {
  #events = new Map<string, GenericHandler>();

  get handlers(): ResolvedDomainHandlerMap<T> {
    return Object.fromEntries(
      this.#events.entries(),
    ) as unknown as ResolvedDomainHandlerMap<T>;
  }

  add(handler: GenericHandler): void {
    const metadata = getHandlerMetadata(handler);
    this.#events.set(metadata.name, handler);
  }
}
