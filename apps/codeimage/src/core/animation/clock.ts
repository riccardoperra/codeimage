export const frameTimeMs = (index: number, fps: number) =>
  Math.floor((index * 1000) / fps);

export const clipFrameCount = (durationMs: number, fps: number) =>
  Math.ceil((durationMs * fps) / 1000);

export const playedDurationMs = (durationMs: number, fps: number) =>
  (clipFrameCount(durationMs, fps) * 1000) / fps;
