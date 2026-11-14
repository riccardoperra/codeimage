// The whole policy as pure functions: no Solid, no IndexedDB, no clock.

import type {Release} from './registry';

export const NEW_FOR_DAYS = 45;
export const DOT_LIMIT = 3;

const DAY_MS = 86_400_000;

/**
 * Everything one device remembers. Both sets only grow, so merging two copies
 * is a union and any order of writes from any number of tabs converges.
 *
 * Members are plain strings because another tab running a newer bundle may
 * have stored ids this bundle does not know, and they must survive a write.
 */
export interface Facts {
  readonly seen: ReadonlySet<string>;
  readonly dismissed: ReadonlySet<string>;
}

export interface StoredFacts {
  readonly v: 1;
  readonly seen: readonly string[];
  readonly dismissed: readonly string[];
}

export const NO_FACTS: Facts = {seen: new Set(), dismissed: new Set()};

type HighlightIdOf<R extends Release> = R['highlights'][number]['id'];

export interface Decision<R extends Release = Release> {
  /** Only ever the newest release. Older ones live in the archive. */
  readonly announcement: {
    readonly surface: 'nudge' | 'showcase';
    readonly release: R;
  } | null;
  /** At most DOT_LIMIT ids, in registry order, so seeing one reveals the next. */
  readonly dots: readonly HighlightIdOf<R>[];
  /** Not seen and not expired. */
  readonly fresh: ReadonlySet<HighlightIdOf<R>>;
}

function isExpired(release: Release, now: number): boolean {
  return now >= Date.parse(release.date) + NEW_FOR_DAYS * DAY_MS;
}

/**
 * Adding a fact can only shrink `fresh` and can only turn `announcement` into
 * null. Nothing a user does makes something new again.
 */
export function decide<R extends Release>(
  releases: readonly R[],
  facts: Facts,
  now: number,
): Decision<R> {
  const fresh = new Set<HighlightIdOf<R>>();
  const dots: HighlightIdOf<R>[] = [];

  for (const release of releases) {
    if (isExpired(release, now)) continue;
    for (const highlight of release.highlights) {
      if (facts.seen.has(highlight.id)) continue;
      fresh.add(highlight.id);
      if (highlight.where !== null && dots.length < DOT_LIMIT) {
        dots.push(highlight.id);
      }
    }
  }

  const latest = releases[0];
  const announce =
    latest !== undefined &&
    !facts.dismissed.has(latest.id) &&
    latest.highlights.some(highlight => fresh.has(highlight.id));

  return {
    announcement: announce
      ? {surface: latest.major ? 'showcase' : 'nudge', release: latest}
      : null,
    dots,
    fresh,
  };
}

export function mergeFacts(a: Facts, b: Facts): Facts {
  return {
    seen: new Set([...a.seen, ...b.seen]),
    dismissed: new Set([...a.dismissed, ...b.dismissed]),
  };
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/**
 * The storage boundary. A missing or corrupt record reads as no facts, so the
 * worst case is one repeated announcement and never a crash.
 */
export function parseFacts(raw: unknown): Facts {
  if (typeof raw !== 'object' || raw === null) return NO_FACTS;
  const record = raw as Record<string, unknown>;
  return {
    seen: new Set(strings(record.seen)),
    dismissed: new Set(strings(record.dismissed)),
  };
}

export function serializeFacts(facts: Facts): StoredFacts {
  return {
    v: 1,
    seen: [...facts.seen].sort(),
    dismissed: [...facts.dismissed].sort(),
  };
}
