import {from, Observable} from 'rxjs';
import {createSignal, observable} from 'solid-js';

export function createStoreNotifier() {
  const [$v, set] = createSignal<number>(0, {equals: false});
  const obs$ = observable($v) as unknown as Observable<number>;
  const track$ = from(obs$);
  const version = () => set(v => ++v);

  const withNotify = <P extends readonly unknown[], T>(
    cb: (...args: P) => T,
  ) => {
    return (...args: P): T => {
      const result = cb(...args);
      if (result instanceof Promise) {
        result.then(() => version());
      } else {
        version();
      }
      return result;
    };
  };

  return [$v, withNotify, track$] as const;
}
