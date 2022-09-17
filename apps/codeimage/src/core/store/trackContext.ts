import {asyncScheduler} from 'rxjs';

export function createTrackContext() {
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
  ] as const;
}
