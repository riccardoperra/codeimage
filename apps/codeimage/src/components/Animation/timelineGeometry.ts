import type {AnimationSegment} from '@codeimage/store/editor/animationSettings';

const GAP = 3;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function timelineGeometry(
  segments: readonly AnimationSegment[],
  viewportWidth: number,
  minimum = 8,
  frozenScale?: number,
) {
  const durationMs = segments.reduce(
    (total, segment) => total + segment.durationMs,
    0,
  );
  const gaps = Math.max(0, segments.length - 1) * GAP;
  const width = Math.max(
    viewportWidth,
    segments.length * (minimum + 20) + gaps,
  );
  const scale =
    frozenScale ??
    (width - gaps - segments.length * minimum) / Math.max(1, durationMs);
  let x = 0;
  const entries = segments.map(segment => {
    const width = minimum + segment.durationMs * scale;
    const entry = {segment, x, width};
    x += width + GAP;
    return entry;
  });
  const timeToX = (ms: number) => {
    const time = clamp(ms, 0, durationMs);
    const entry = entries.find(
      ({segment}) => time < segment.startMs + segment.durationMs,
    );
    if (!entry) return Math.max(0, x - GAP);
    return (
      entry.x +
      ((time - entry.segment.startMs) / entry.segment.durationMs) * entry.width
    );
  };
  const xToTime = (x: number) => {
    const entry = entries.find(entry => x < entry.x + entry.width);
    if (!entry) return durationMs;
    return (
      entry.segment.startMs +
      clamp((x - entry.x) / entry.width, 0, 1) * entry.segment.durationMs
    );
  };
  return {
    entries,
    width: Math.max(0, x - GAP),
    scale,
    timeToX,
    xToTime,
    resizedDuration: (initial: number, deltaX: number) =>
      initial + deltaX / scale,
  };
}

export type TimelineGeometry = ReturnType<typeof timelineGeometry>;
