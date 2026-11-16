import {frameTimeMs} from './types';
import type {Prepared} from './prepare';
import {last} from '../lib';
import {type Measured, settings} from './types';
import {type Rect, fromSegment} from './paint-checks';
export async function checkGeometry({
  document,
  path,
  fromHold,
  early,
  late,
  frameOf,
  animation,
}: Prepared) {
  const windowOf = (frame: Measured): Rect | null => {
    if (!document.frame.exportTarget || !path) return null;
    const window = frame.children[path[5]].children[path[6]];
    const [a, , , d, x, y] = window.transform;
    return {
      x: x - frame.transform[4],
      y: y - frame.transform[5],
      width: window.width * a,
      height: window.height * d,
    };
  };

  let center = 0;
  const windows: Rect[] = [];
  const transition = {
    startMs: fromHold.durationMs,
    endMs: fromHold.durationMs + early.durationMs + late.durationMs,
  };
  const frameTimes: number[] = [];
  for (let index = 0; ; index++) {
    const timeMs = frameTimeMs(index, settings.fps);
    if (timeMs >= transition.endMs) break;
    if (timeMs >= transition.startMs) frameTimes.push(timeMs);
  }
  for (const timeMs of [...frameTimes, transition.endMs]) {
    const sinceStart = timeMs - transition.startMs;
    const frame =
      sinceStart < early.durationMs
        ? await frameOf(early, sinceStart)
        : await frameOf(late, sinceStart - early.durationMs);
    center = Math.max(
      center,
      Math.abs(frame.transform[4] + frame.width / 2 - animation.width / 2),
      Math.abs(frame.transform[5] + frame.height / 2 - animation.height / 2),
    );
    const window = windowOf(frame);
    if (window) windows.push(window);
  }

  const middle = (box: Rect) => ({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });
  const padding = document.frame.padding;
  const windowDrift = Math.max(
    0,
    ...windows.map(box =>
      fromSegment(middle(box), middle(windows[0]), middle(last(windows))),
    ),
  );
  const outOf = (box: Rect) =>
    Math.max(
      0,
      padding - box.x,
      padding - box.y,
      box.x + box.width - (animation.width - padding),
      box.y + box.height - (animation.height - padding),
    );

  const endsOut = windows.length
    ? Math.max(outOf(windows[0]), outOf(last(windows)))
    : 0;
  const windowOut = Math.max(0, ...windows.map(outOf)) - endsOut;
  return {center, windows, windowDrift, windowOut, endsOut};
}
