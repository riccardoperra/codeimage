// The clock every animation export samples. Frame `index` shows the clip at
// frameTimeMs and lasts 1000 / fps ms, so a clip always plays whole frames.
export const frameTimeMs = (index: number, fps: number) =>
  Math.floor((index * 1000) / fps);

// The frames that show some part of a clip `durationMs` long.
export const clipFrameCount = (durationMs: number, fps: number) =>
  Math.ceil((durationMs * fps) / 1000);

// How long a clip plays: its last frame lasts a whole frame too.
export const playedDurationMs = (durationMs: number, fps: number) =>
  (clipFrameCount(durationMs, fps) * 1000) / fps;
