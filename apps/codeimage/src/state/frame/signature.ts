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

interface ProfileMatch {
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
