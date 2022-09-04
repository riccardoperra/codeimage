import {asyncScheduler, filter, MonoTypeOperatorFunction, pipe} from 'rxjs';
import {Accessor, untrack} from 'solid-js';

export function createTrackObserver(): [
  track: Accessor<boolean>,
  untrackCallback: (cb: () => void) => void,
] {
  let track = true;
  return [
    () => track,
    (cb: () => void) => {
      track = false;
      cb();
      asyncScheduler.schedule(() => {
        track = true;
      });
    },
  ];
}

export function emitWhenTracked<T>(
  trackedState: Accessor<boolean>,
): MonoTypeOperatorFunction<T> {
  return filter(() => untrack(trackedState));
}
