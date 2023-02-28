import {GenericHandler, HandlerCallback, ResolveHandler} from './types';

export class EventRegistry {
  #events = new WeakMap<HandlerCallback, GenericHandler>();

  add(cb: any) {
    console.log(cb);
  }

  execute<
    T extends HandlerCallback,
    TResolveHandler extends ResolveHandler<T> = ResolveHandler<T>,
  >(handler: T, ...args: Parameters<TResolveHandler>) {
    const handlerCallback = this.#events.get(handler);
    if (!handlerCallback) {
      return;
    }
    return handlerCallback(...args);
  }
}

export const AppEventRegistry = new EventRegistry();
