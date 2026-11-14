import type {ExportTargetId} from '@codeimage/config';
import type {AssetId} from '../assets/assets';

export const SIGNATURE_STYLES = ['minimal', 'pill', 'card'] as const;
export const SIGNATURE_PLATFORMS = [
  'x',
  'bluesky',
  'github',
  'mastodon',
  'linkedin',
] as const;
export const SIGNATURE_POSITIONS = [
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

export type SignatureStyle = (typeof SIGNATURE_STYLES)[number];
export type SignaturePlatform = (typeof SIGNATURE_PLATFORMS)[number];
export type SignaturePosition = (typeof SIGNATURE_POSITIONS)[number];
/**
 * `profile` loads the public avatar of the profile (or of the handle on its
 * platform); an asset id is an uploaded image.
 */
export type SignatureAvatar = 'profile' | AssetId;

export interface FrameSignature {
  handle: string;
  position: SignaturePosition;
  style: SignatureStyle;
  platform: SignaturePlatform | null;
  /** Shown by the card style only. */
  name: string | null;
  /** Shown by the card style only; initials stand in for a missing one. */
  avatar: SignatureAvatar | null;
  /**
   * Where the `profile` avatar comes from when the handle is not the right
   * account, as `github.com/<login>`, `bsky.app/profile/<handle>`,
   * `@<user>@<instance>`, `x.com/<user>` or `linkedin.com/in/<user>`.
   */
  profile: string | null;
  /**
   * The saved signature this copy came from. The snippet keeps its own copy,
   * so editing the saved signature never changes it.
   */
  savedId: string | null;
}

export interface FrameState {
  background: string | null;
  padding: number;
  radius: number;
  visible: boolean;
  opacity: number;
  autoWidth: boolean;
  scale: number;
  width: number;
  height: number;
  signature: FrameSignature | null;
  aspectRatio: string | null;
  exportTarget: ExportTargetId | null;
}

export type PersistedFrameState = Pick<
  FrameState,
  | 'background'
  | 'padding'
  | 'radius'
  | 'visible'
  | 'opacity'
  | 'signature'
  | 'aspectRatio'
  | 'exportTarget'
>;

const oneOf = <T extends string>(values: readonly T[], value: unknown) =>
  values.find(item => item === value);

/**
 * Reads a signature saved by any version: P7 saved only the handle and two
 * positions, and a preset or a project may carry fields from a newer one.
 */
export function parseSignature(value: unknown): FrameSignature | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.handle !== 'string' || !raw.handle.trim()) return null;
  const avatar = raw.avatar;
  return {
    handle: raw.handle,
    position: oneOf(SIGNATURE_POSITIONS, raw.position) ?? 'bottom-right',
    style: oneOf(SIGNATURE_STYLES, raw.style) ?? 'minimal',
    platform: oneOf(SIGNATURE_PLATFORMS, raw.platform) ?? null,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : null,
    // `github` is how the first signature styles named the profile avatar.
    avatar:
      avatar === 'profile' || avatar === 'github'
        ? 'profile'
        : typeof avatar === 'string' && avatar.startsWith('asset:')
          ? (avatar as SignatureAvatar)
          : null,
    profile:
      typeof raw.profile === 'string' && raw.profile.trim()
        ? raw.profile.trim().slice(0, 200)
        : null,
    savedId:
      typeof raw.savedId === 'string' && raw.savedId ? raw.savedId : null,
  };
}

export function createSignature(handle: string): FrameSignature {
  return {
    handle,
    position: 'bottom-right',
    style: 'minimal',
    platform: null,
    name: null,
    avatar: null,
    profile: null,
    savedId: null,
  };
}
