import type {FrameSignature, SignaturePlatform} from './model';

/** The handle as the frame shows it: `@` in front, except where a platform writes it otherwise. */
export function displayHandle(
  signature: Pick<FrameSignature, 'handle' | 'platform'>,
): string {
  const handle = signature.handle.trim();
  if (!handle || handle.startsWith('@')) return handle;
  if (signature.platform === 'linkedin' || handle.startsWith('in/'))
    return handle;
  return `@${handle}`;
}

/** The GitHub login the `github` avatar loads: the handle without `@` or an instance. */
export function githubLogin(handle: string): string | null {
  const login = handle.trim().replace(/^@/, '').split('@')[0];
  return /^[a-z\d](?:[a-z\d-]{0,38})$/i.test(login) ? login : null;
}

export function initials(signature: Pick<FrameSignature, 'handle' | 'name'>) {
  const source =
    signature.name?.trim() || signature.handle.trim().replace(/^@/, '');
  const words = source.split(/[\s._-]+/).filter(Boolean);
  const letters =
    words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map(word => Array.from(word)[0]?.toUpperCase() ?? '').join('');
}

export interface ProfileMatch {
  readonly handle: string;
  readonly platform: SignaturePlatform;
}

const RESERVED = new Set(['home', 'explore', 'search', 'settings', 'i']);

/**
 * Reads a pasted profile link or a fediverse address, so that pasting
 * `https://x.com/octocat` gives `octocat` on X. Anything else is a handle as typed.
 */
export function parseProfile(input: string): ProfileMatch | null {
  const value = input.trim();
  const fediverse = value.match(/^@?([\w.-]+)@([a-z\d-]+(?:\.[a-z\d-]+)+)$/i);
  if (fediverse)
    return {handle: `@${fediverse[1]}@${fediverse[2]}`, platform: 'mastodon'};

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (!url.hostname.includes('.')) return null;
  const host = url.hostname.replace(/^(www|mobile|m)\./, '');
  const [first, second] = url.pathname.split('/').filter(Boolean);
  if (!first) return null;

  switch (host) {
    case 'x.com':
    case 'twitter.com':
      return RESERVED.has(first) ? null : {handle: first, platform: 'x'};
    case 'bsky.app':
      return first === 'profile' && second
        ? {handle: second, platform: 'bluesky'}
        : null;
    case 'github.com':
      return {handle: first, platform: 'github'};
    case 'linkedin.com':
      return first === 'in' && second
        ? {handle: `in/${second}`, platform: 'linkedin'}
        : null;
  }
  return first.startsWith('@') && first.length > 1
    ? {handle: `${first}@${host}`, platform: 'mastodon'}
    : null;
}

/** What the profile field shows before the account, for each platform. */
export const PROFILE_PREFIX: Record<SignaturePlatform, string> = {
  x: 'x.com/',
  bluesky: 'bsky.app/profile/',
  github: 'github.com/',
  mastodon: '@',
  linkedin: 'linkedin.com/in/',
};

/** The stored form of a profile: the prefix, then the account. */
export function profileString(profile: ProfileMatch): string {
  switch (profile.platform) {
    case 'mastodon':
      return profile.handle.startsWith('@')
        ? profile.handle
        : `@${profile.handle}`;
    case 'linkedin':
      return `linkedin.com/${profile.handle}`;
    default:
      return `${PROFILE_PREFIX[profile.platform]}${profile.handle}`;
  }
}

/** The platform and the account part of a stored profile, for the field. */
export function readProfile(
  profile: string | null,
): {platform: SignaturePlatform; account: string} | null {
  const match = profile ? parseProfile(profile) : null;
  if (!match) return null;
  const prefix = PROFILE_PREFIX[match.platform];
  const stored = profileString(match);
  return {platform: match.platform, account: stored.slice(prefix.length)};
}

/**
 * Turns what the profile field holds into the stored profile. A pasted link
 * or a fediverse address names its own platform; anything else is the
 * account on the platform the field shows.
 */
export function writeProfile(
  value: string,
  platform: SignaturePlatform,
): string | null {
  const input = value.trim();
  if (!input) return null;
  const pasted = /[/@]/.test(input.replace(/^@/, ''))
    ? parseProfile(input)
    : null;
  if (pasted) return profileString(pasted);
  const account = input.replace(/^@/, '');
  if (platform === 'mastodon') return `@${account}`;
  if (platform === 'linkedin') return `linkedin.com/in/${account}`;
  return `${PROFILE_PREFIX[platform]}${account}`;
}

export type AvatarSource =
  | {readonly provider: 'github'; readonly login: string}
  | {readonly provider: 'bluesky'; readonly actor: string}
  | {
      readonly provider: 'mastodon';
      readonly user: string;
      readonly instance: string;
    };

/**
 * Where the `profile` avatar comes from: the profile when one is set, else
 * the handle on its platform, and GitHub for a handle without a platform.
 * X and LinkedIn have no public, keyless avatar, so they give none.
 */
export function avatarSource(
  signature: Pick<FrameSignature, 'handle' | 'platform' | 'profile'>,
): AvatarSource | null {
  const fromProfile = signature.profile
    ? parseProfile(signature.profile)
    : null;
  const handle = fromProfile?.handle ?? signature.handle.trim();
  const platform = fromProfile?.platform ?? signature.platform ?? 'github';
  switch (platform) {
    case 'github': {
      const login = githubLogin(handle);
      return login ? {provider: 'github', login} : null;
    }
    case 'bluesky': {
      const actor = handle.replace(/^@/, '').toLowerCase();
      return /^(?:did:[a-z]+:[\w.:%-]+|[a-z\d-]+(?:\.[a-z\d-]+)+)$/.test(actor)
        ? {provider: 'bluesky', actor}
        : null;
    }
    case 'mastodon': {
      const match = handle.match(/^@?([\w.-]+)@([a-z\d-]+(?:\.[a-z\d-]+)+)$/i);
      return match
        ? {
            provider: 'mastodon',
            user: match[1],
            instance: match[2].toLowerCase(),
          }
        : null;
    }
    default:
      return null;
  }
}
