import type {FrameState, SignatureStyle} from '@codeimage/store/frame/model';

// Height of each style plus 20px under it and 16px over it, at scale 1, so
// the code window never runs under the signature.
const RESERVED_SPACE: Record<SignatureStyle, number> = {
  minimal: 20 + 24 + 16,
  pill: 20 + 36 + 16,
  card: 20 + 64 + 16,
};

/** The frame width at which the signature has its base size. */
const BASE_WIDTH = 640;
const MIN_SCALE = 0.85;
const MAX_SCALE = 2;

/**
 * The signature grows with the frame, so that it reads the same on a
 * 1600px social image as on a 640px snippet. A missing width means 1.
 */
export function signatureScale(frameWidth: number | null | undefined): number {
  if (!frameWidth || !Number.isFinite(frameWidth)) return 1;
  const scale = frameWidth / BASE_WIDTH;
  return (
    Math.round(Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) * 1000) / 1000
  );
}

export function framePadding(
  padding: number,
  signature: FrameState['signature'],
  scale = 1,
) {
  if (!signature) return `${padding}px`;
  const bottom = Math.max(
    padding,
    Math.ceil(RESERVED_SPACE[signature.style] * scale),
  );
  return `${padding}px ${padding}px ${bottom}px`;
}
