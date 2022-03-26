import {Observable} from 'rxjs';

const createResizeObserverFactory = () => {
  return (element: HTMLElement, options?: ResizeObserverOptions) =>
    new ReactiveResizeObserver(element, options);
};

class ReactiveResizeObserver extends Observable<
  ReadonlyArray<ResizeObserverEntry>
> {
  constructor(element: HTMLElement, options?: ResizeObserverOptions) {
    let observer: ResizeObserver;

    super(subscriber => {
      observer = new ResizeObserver(entries => subscriber.next(entries));
      observer.observe(element, options);
      return () => observer.disconnect();
    });
  }
}

export const resizeObserverFactory$ = createResizeObserverFactory();
