import {DomainHandler, GenericHandler, HandlerCallback} from '@api/domain';

export class EventRegistry {
  #events = new Map<string, GenericHandler>();

  add<Dependencies>(
    handler: HandlerCallback<Dependencies>,
    dependencies: Dependencies,
  ) {
    const name = Reflect.get(handler, 'eventHandlerName');
    if (name) {
      throw new Error('Given object is not a valid handler');
    }
    this.#events.set(name, handler(dependencies));
  }

  execute<K extends keyof DomainHandler>(
    event: K,
    payload: Parameters<DomainHandler[K]>,
  ): ReturnType<DomainHandler[K]> {
    const cb = this.#events.get(event);
    if (!cb) {
      throw new Error('Given string is not a valid event name');
    }
    return cb(...payload);
  }
}
