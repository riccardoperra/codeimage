import {Observable} from 'rxjs';

const createMutationObserverFactory = () => {
  return (element: HTMLElement, options?: MutationObserverInit) =>
    new ReactiveMutationObserver(element, options);
};

class ReactiveMutationObserver extends Observable<
  ReadonlyArray<MutationRecord>
> {
  constructor(element: HTMLElement, options?: MutationObserverInit) {
    let observer: MutationObserver;

    super(subscriber => {
      observer = new MutationObserver(entries => subscriber.next(entries));
      observer.observe(element, options);
      return () => observer.disconnect();
    });
  }
}

export const mutationObserverFactory$ = createMutationObserverFactory();
