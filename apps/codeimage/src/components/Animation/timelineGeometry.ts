import type {AnimationSegment} from '@codeimage/store/editor/animationSettings';

export const TIMELINE_GAP = 3;
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function timelineGeometry(
  segments: readonly AnimationSegment[],
  viewportWidth: number,
  options: {labels: boolean; minWidth: number} = {labels: true, minWidth: 8},
) {
  const durationMs = segments.reduce(
    (total, segment) => total + segment.durationMs,
    0,
  );
  const width = Math.max(0, viewportWidth);
  const gap = Math.min(TIMELINE_GAP, width / Math.max(1, segments.length * 2));
  const reservedGaps = Math.max(0, segments.length - 1) * gap;
  const minimum = Math.min(
    options.minWidth,
    ((width - reservedGaps) / Math.max(1, segments.length)) * 0.8,
  );
  const scale =
    (width - reservedGaps - segments.length * minimum) /
    Math.max(1, durationMs);
  let x = 0;
  const entries = segments.map(segment => {
    const width = minimum + segment.durationMs * scale;
    const label = !options.labels
      ? 'none'
      : width >= (segment.kind === 'hold' ? 88 : 72)
        ? 'full'
        : segment.kind === 'hold' &&
            width >= String(segment.index + 1).length * 7
          ? 'number'
          : 'none';
    const entry = {segment, x, width, label};
    x += width + gap;
    return entry;
  });
  const timeToX = (ms: number) => {
    const time = clamp(ms, 0, durationMs);
    if (time === 0) return 0;
    const entry = entries.find(
      ({segment}) => time < segment.startMs + segment.durationMs,
    );
    if (!entry) return Math.max(0, x - gap);
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
    width: Math.max(0, x - gap),
    scale,
    gap,
    timeToX,
    xToTime,
    ticks: (stepMs: number, spacing = 64) => {
      let previous = -Infinity;
      return Array.from(
        {length: Math.floor(durationMs / stepMs) + 1},
        (_, index) => index * stepMs,
      ).filter(ms => {
        const x = timeToX(ms);
        if (x - previous < spacing) return false;
        previous = x;
        return true;
      });
    },
    resizedDuration: (initial: number, deltaX: number) =>
      initial + deltaX / Math.max(Number.EPSILON, scale),
  };
}

export type TimelineGeometry = ReturnType<typeof timelineGeometry>;
