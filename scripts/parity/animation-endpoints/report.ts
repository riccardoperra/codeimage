import type {Prepared} from './prepare';
import {MAX_DIFF_PERCENT} from '../lib';
import type {checkGeometry} from './geometry';
import type {checkEndpoints} from './endpoints';
import type {checkEncoded} from './encoded';
import {
  CENTER_TOLERANCE,
  WINDOW_DRIFT_TOLERANCE,
  WINDOW_OUT_TOLERANCE,
} from './paint-checks';
export function reportCase(
  {name, reference, scale, animation, identity}: Prepared,
  {
    center,
    windows,
    windowDrift,
    windowOut,
    endsOut,
  }: Awaited<ReturnType<typeof checkGeometry>>,
  {
    layout,
    paint,
    startDiff,
    endDiff,
    worstFrame,
    frames,
  }: Awaited<ReturnType<typeof checkEndpoints>>,
  {encoded, encodedDiff, ghosts}: Awaited<ReturnType<typeof checkEncoded>>,
) {
  const pass =
    layout === null &&
    paint === null &&
    center <= CENTER_TOLERANCE &&
    windowDrift <= WINDOW_DRIFT_TOLERANCE / scale &&
    windowOut <= WINDOW_OUT_TOLERANCE / scale &&
    encodedDiff <= MAX_DIFF_PERCENT &&
    ghosts === 0 &&
    reference === 0 &&
    startDiff <= MAX_DIFF_PERCENT &&
    endDiff <= MAX_DIFF_PERCENT &&
    worstFrame <= MAX_DIFF_PERCENT;

  const row = {
    case: name,
    reference: reference.toFixed(3),
    start: startDiff.toFixed(3),
    end: endDiff.toFixed(3),
    layout: layout ?? 'ok',
    paint: paint ?? 'ok',
    center: center.toFixed(3),
    ...(windows.length
      ? {
          window: `${windowDrift.toFixed(3)} ${windowOut.toFixed(3)} (ends ${endsOut.toFixed(3)})`,
        }
      : {}),
    ...(identity ? {worstFrame: worstFrame.toFixed(3)} : {}),
    size: `${animation.width}x${animation.height}`,
    frames,
    ...encoded,
    pass,
  };
  return row;
}
