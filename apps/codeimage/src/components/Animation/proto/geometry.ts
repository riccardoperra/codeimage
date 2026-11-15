import type {AnimationSegment} from '@codeimage/store/editor/animationSettings';
import type {TimelineGeometry} from '../timelineGeometry';

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/** Same shape as the branch's geometry, with a free scale: fit or fixed px/ms. */
export function scaledGeometry(
  segments: readonly AnimationSegment[],
  options: {width?: number; scale?: number; min: number; gap: number},
): TimelineGeometry {
  const total = segments.reduce((sum, s) => sum + s.durationMs, 0);
  const gaps = Math.max(0, segments.length - 1) * options.gap;
  const scale =
    options.scale ??
    Math.max(0, (options.width ?? 0) - gaps - segments.length * options.min) /
      Math.max(1, total);
  let x = 0;
  const entries = segments.map(segment => {
    const width = options.min + segment.durationMs * scale;
    const entry = {segment, x, width};
    x += width + options.gap;
    return entry;
  });
  const timeToX = (ms: number) => {
    const time = clamp(ms, 0, total);
    const entry = entries.find(
      ({segment}) => time < segment.startMs + segment.durationMs,
    );
    if (!entry) return Math.max(0, x - options.gap);
    return (
      entry.x +
      ((time - entry.segment.startMs) / entry.segment.durationMs) * entry.width
    );
  };
  const xToTime = (px: number) => {
    const entry = entries.find(entry => px < entry.x + entry.width);
    if (!entry) return total;
    return (
      entry.segment.startMs +
      clamp((px - entry.x) / entry.width, 0, 1) * entry.segment.durationMs
    );
  };
  return {
    entries,
    width: Math.max(0, x - options.gap),
    scale,
    timeToX,
    xToTime,
    resizedDuration: (initial: number, deltaX: number) =>
      initial + deltaX / Math.max(scale, 1e-6),
  };
}
