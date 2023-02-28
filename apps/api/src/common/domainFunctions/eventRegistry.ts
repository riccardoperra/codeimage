import {DomainHandler, GenericHandler, HandlerCallback} from '@api/domain';

export class EventRegistry {
  #events = new Map<string, GenericHandler>();

  add<Dependencies>(
    cb: HandlerCallback<Dependencies>,
    dependencies: Dependencies,
  ) {
    console.log('add cb test', cb);

    const name = Reflect.get(cb, 'eventHandlerName');
    this.#events.set(name, cb(dependencies));
  }

  execute<K extends keyof DomainHandler>(
    event: K,
    payload: Parameters<DomainHandler[K]>,
  ): ReturnType<DomainHandler[K]> {
    const cb = this.#events.get(event);
    if (!cb) {
      throw new Error('Event not found');
    }
    return cb(...payload);
  }
}
