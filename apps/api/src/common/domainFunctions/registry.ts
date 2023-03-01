import {DomainHandlerMap, GenericHandler} from '@api/domain';
import {getHandlerMetadata} from './handlers';

export class HandlerRegistry {
  #events = new Map<string, GenericHandler>();

  get handlers(): DomainHandlerMap {
    return Object.fromEntries(
      this.#events.entries(),
    ) as unknown as DomainHandlerMap;
  }

  add(handler: (...args: any[]) => any): void {
    const metadata = getHandlerMetadata(handler);
    this.#events.set(metadata.name, handler);
  }
}
