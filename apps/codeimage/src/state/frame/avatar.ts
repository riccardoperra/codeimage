import type {AvatarSource} from './signature';

/**
 * Loads a public avatar from an endpoint that needs no key and answers with
 * CORS headers, and keeps it as a small data URL. The frame draws that data
 * URL, so the downloaded image never depends on the avatar host's headers.
 * Any failure gives `null`, and the frame shows initials.
 */
const SIZE = 192;
const cache = new Map<string, Promise<string | null>>();

export function avatarKey(source: AvatarSource): string {
  switch (source.provider) {
    case 'github':
      return `github:${source.login.toLowerCase()}`;
    case 'bluesky':
      return `bluesky:${source.actor}`;
    case 'mastodon':
      return `mastodon:${source.user.toLowerCase()}@${source.instance}`;
  }
}

export function loadAvatar(source: AvatarSource): Promise<string | null> {
  const key = avatarKey(source);
  let entry = cache.get(key);
  if (!entry) {
    entry = avatarImageUrl(source)
      .then(url => (url ? shrink(url) : null))
      .catch(() => null);
    // A failure is not kept, so the next render tries again.
    void entry.then(result => {
      if (!result) cache.delete(key);
    });
    cache.set(key, entry);
  }
  return entry;
}

async function json(
  url: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown> | null> {
  const response = await fetch(url, {
    headers: {Accept: 'application/json'},
    signal,
  });
  if (!response.ok) return null;
  return (await response.json()) as Record<string, unknown>;
}

export async function avatarImageUrl(
  source: AvatarSource,
  signal?: AbortSignal,
): Promise<string | null> {
  switch (source.provider) {
    case 'github':
      // The same image as `github.com/<login>.png`, whose redirect has no CORS headers.
      return `https://avatars.githubusercontent.com/${encodeURIComponent(
        source.login,
      )}?s=${SIZE}`;
    case 'mastodon': {
      const account = await json(
        `https://${source.instance}/api/v1/accounts/lookup?acct=${encodeURIComponent(
          source.user,
        )}`,
        signal,
      );
      const url = account?.avatar_static ?? account?.avatar;
      return typeof url === 'string' ? url : null;
    }
    case 'bluesky':
      return blueskyAvatar(source.actor, signal);
  }
}

/**
 * Bluesky's image CDN sends no CORS headers, so the avatar is read as a blob
 * from the account's own server (its PDS), which does.
 */
async function blueskyAvatar(
  actor: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const profile = await json(
    `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(
      actor,
    )}`,
    signal,
  );
  const did = profile?.did;
  const avatar = profile?.avatar;
  if (typeof did !== 'string' || typeof avatar !== 'string') return null;
  const cid = avatar.match(/\/([a-z\d]+)(?:@[a-z]+)?$/i)?.[1];
  if (!cid) return null;
  const pds = await personalDataServer(did, signal);
  if (!pds) return null;
  return `${pds}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(
    did,
  )}&cid=${encodeURIComponent(cid)}`;
}

async function personalDataServer(
  did: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const document = did.startsWith('did:plc:')
    ? await json(`https://plc.directory/${did}`, signal)
    : did.startsWith('did:web:')
      ? await json(
          `https://${did.slice('did:web:'.length)}/.well-known/did.json`,
          signal,
        )
      : null;
  const services = document?.service;
  if (!Array.isArray(services)) return null;
  const pds = services.find(
    (service: {id?: string}) => service?.id === '#atproto_pds',
  ) as {serviceEndpoint?: unknown} | undefined;
  const endpoint = pds?.serviceEndpoint;
  return typeof endpoint === 'string' && endpoint.startsWith('https://')
    ? endpoint.replace(/\/$/, '')
    : null;
}

/** A square of 192px, center-cropped, as a WebP data URL. */
async function shrink(url: string): Promise<string | null> {
  const response = await fetch(url, {mode: 'cors'});
  if (!response.ok) return null;
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) return null;
  const bitmap = await createImageBitmap(blob);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();
  const webp = canvas.toDataURL('image/webp', 0.9);
  return webp.startsWith('data:image/webp')
    ? webp
    : canvas.toDataURL('image/png');
}
