import type {MonoTypeOperatorFunction} from 'rxjs';
import {asyncScheduler, filter} from 'rxjs';
import type {Accessor} from 'solid-js';
import {untrack} from 'solid-js';

export function createTrackObserver(): [
  track: Accessor<boolean>,
  untrackCallback: (cb: () => void, async?: boolean) => void,
] {
  let track = true;
  return [
    () => track,
    (cb: () => void, async = true) => {
      track = false;
      cb();
      const schedule = async
        ? asyncScheduler.schedule
        : (cb: () => void) => cb();

      schedule(() => (track = true));
    },
  ];
}

export function emitWhenTracked<T>(
  trackedState: Accessor<boolean>,
): MonoTypeOperatorFunction<T> {
  return filter(() => untrack(trackedState));
}
