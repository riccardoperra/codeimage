import {describe, expect, it} from 'vitest';
import type {Facts} from './decide';
import {
  decide,
  mergeFacts,
  NO_FACTS,
  parseFacts,
  serializeFacts,
} from './decide';
import type {Release} from './registry';
import {RELEASES, UPCOMING} from './registry';

const day = (iso: string) => Date.parse(iso);
const facts = (
  seen: string[] = [],
  dismissed: string[] = [],
  minimized: string[] = [],
): Facts => ({
  seen: new Set(seen),
  dismissed: new Set(dismissed),
  minimized: new Set(minimized),
});

const latest = {
  id: 'r2',
  date: '2026-11-14',
  major: false,
  highlights: [
    {id: 'a', where: 'command-menu'},
    {id: 'b', where: null},
    {id: 'c', where: 'command-menu'},
    {id: 'd', where: 'command-menu'},
    {id: 'e', where: 'command-menu'},
  ],
} as const satisfies Release;

const older = {
  id: 'r1',
  date: '2026-10-20',
  major: true,
  highlights: [{id: 'z', where: 'command-menu'}],
} as const satisfies Release;

const releases = [latest, older];

describe('decide', () => {
  it('announces the newest release with the nudge on a first visit', () => {
    const decision = decide(releases, NO_FACTS, day('2026-11-15'));
    expect(decision.announcement).toEqual({surface: 'nudge', release: latest});
  });

  it('announces a major release with the showcase', () => {
    const decision = decide([older], NO_FACTS, day('2026-10-21'));
    expect(decision.announcement?.surface).toBe('showcase');
  });

  it('never announces an older release, even when it was never dismissed', () => {
    const decision = decide(releases, facts([], ['r2']), day('2026-11-15'));
    expect(decision.announcement).toBeNull();
  });

  it('stops announcing once every highlight of the release is seen', () => {
    const decision = decide(
      releases,
      facts(['a', 'b', 'c', 'd', 'e']),
      day('2026-11-15'),
    );
    expect(decision.announcement).toBeNull();
  });

  it('shows at most three dots, in registry order, skipping unlocated highlights', () => {
    const decision = decide(releases, NO_FACTS, day('2026-11-15'));
    expect(decision.dots).toEqual(['a', 'c', 'd']);
  });

  it('reveals the next dot when one is seen', () => {
    const decision = decide(releases, facts(['a']), day('2026-11-15'));
    expect(decision.dots).toEqual(['c', 'd', 'e']);
  });

  it('keeps a seen highlight out of fresh while the rest stay new', () => {
    const decision = decide([latest], facts(['b']), day('2026-11-15'));
    expect([...decision.fresh]).toEqual(['a', 'c', 'd', 'e']);
  });

  it('expires a release 45 days after its date', () => {
    const lastDay = decide([latest], NO_FACTS, day('2026-12-29') - 1);
    const expired = decide([latest], NO_FACTS, day('2026-12-29'));
    expect(lastDay.announcement).not.toBeNull();
    expect(expired).toEqual({announcement: null, dots: [], fresh: new Set()});
  });

  it('expires each release on its own date', () => {
    const decision = decide(releases, NO_FACTS, day('2026-12-10'));
    expect(decision.fresh.has('z')).toBe(false);
    expect(decision.fresh.has('a')).toBe(true);
  });

  it('has nothing to show with an empty registry', () => {
    expect(decide([], NO_FACTS, 0).announcement).toBeNull();
  });

  it('ignores stored ids this bundle does not know', () => {
    const decision = decide(
      releases,
      facts(['from-a-newer-tab'], ['r9']),
      day('2026-11-15'),
    );
    expect(decision.announcement?.release.id).toBe('r2');
  });
});

describe('facts', () => {
  it('merges as a union, in any order', () => {
    const one = facts(['a'], ['r1']);
    const two = facts(['b'], ['r2']);
    expect(mergeFacts(one, two)).toEqual(mergeFacts(two, one));
    expect(mergeFacts(one, two)).toEqual(facts(['a', 'b'], ['r1', 'r2']));
  });

  it('merging the same facts twice changes nothing', () => {
    const one = facts(['a'], ['r1']);
    expect(mergeFacts(mergeFacts(one, one), one)).toEqual(one);
  });

  it('survives a storage round trip', () => {
    const stored = facts(['b', 'a'], ['r1']);
    expect(parseFacts(serializeFacts(stored))).toEqual(stored);
  });

  it.each([
    undefined,
    null,
    'text',
    42,
    {},
    {seen: 'a'},
    {appVersion: '1.9.0', seen: ['1.9.0'], features: {}},
  ])('reads %j without throwing', raw => {
    expect(() => parseFacts(raw)).not.toThrow();
  });

  it('reads a missing record as no facts', () => {
    expect(parseFacts(undefined)).toEqual(NO_FACTS);
  });

  it('drops non-string members of a corrupt record', () => {
    expect(parseFacts({seen: ['a', 1, null], dismissed: [{}]})).toEqual(
      facts(['a']),
    );
  });
});

describe('registry', () => {
  it('lists releases newest first', () => {
    const dates = RELEASES.map(release => Date.parse(release.date));
    expect(dates.every(date => !Number.isNaN(date))).toBe(true);
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('never repeats a release id or a highlight id', () => {
    const releaseIds = RELEASES.map(release => release.id);
    const highlightIds = RELEASES.flatMap(release =>
      release.highlights.map(highlight => highlight.id),
    );
    expect(new Set(releaseIds).size).toBe(releaseIds.length);
    const allIds = [
      ...highlightIds,
      ...UPCOMING.map(highlight => highlight.id),
    ];
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

it('announces 2.0 as a Showcase and advances all located highlights within three dots', () => {
  const seen = new Set<string>();
  const located = RELEASES[0].highlights.filter(
    highlight => highlight.where !== null,
  );
  for (const highlight of located) {
    const result = decide(
      RELEASES,
      {...NO_FACTS, seen},
      Date.parse('2026-11-14'),
    );
    expect(result.announcement?.surface).toBe('showcase');
    expect(result.dots.length).toBeLessThanOrEqual(3);
    expect(result.dots[0]).toBe(highlight.id);
    seen.add(highlight.id);
  }
});

it('prioritizes the editorial order and keeps accessory highlights after the headlines', () => {
  expect(RELEASES[0].highlights.map(highlight => highlight.id)).toEqual([
    'layouts',
    'marks',
    'takumi',
    'signature',
    'window-styles',
    'redact',
    'social',
    'tabs',
    'alt',
    'command-menu',
    'theme-cards',
  ]);
  expect(decide(RELEASES, NO_FACTS, day('2026-11-15')).dots).toEqual([
    'layouts',
    'marks',
    'takumi',
  ]);
  expect(
    RELEASES[0].highlights
      .filter(highlight => !('accessory' in highlight))
      .map(highlight => highlight.id),
  ).toEqual([
    'layouts',
    'marks',
    'takumi',
    'signature',
    'window-styles',
    'redact',
  ]);
  expect(
    RELEASES[0].highlights
      .filter(highlight => 'accessory' in highlight)
      .map(highlight => highlight.id),
  ).toEqual(['social', 'tabs', 'alt', 'command-menu', 'theme-cards']);
});

it('never decides on upcoming content, even when stored facts mention it', () => {
  const result = decide(
    RELEASES,
    facts(UPCOMING.map(highlight => highlight.id)),
    day('2026-11-15'),
  );
  for (const {id} of UPCOMING) {
    expect([...result.fresh]).not.toContain(id);
    expect(result.dots).not.toContain(id);
    expect(
      result.announcement?.release.highlights.map(highlight => highlight.id),
    ).not.toContain(id);
  }
});

it('minimizes a major release without consuming highlights or dismissing it', () => {
  const before = decide([older], NO_FACTS, day('2026-10-21'));
  const after = decide([older], facts([], [], ['r1']), day('2026-10-21'));
  expect(after).toEqual({
    ...before,
    announcement: {surface: 'nudge', release: older},
  });
  expect(
    decide([older], facts([], ['r1'], ['r1']), day('2026-10-21')).announcement,
  ).toBeNull();
});
it('unions minimized releases across tabs and round trips them with unknown ids', () => {
  const a = facts(['a'], ['r1'], ['r2']);
  const b = facts(['b'], [], ['future-release']);
  const merged = mergeFacts(a, b);
  expect(merged).toEqual(facts(['a', 'b'], ['r1'], ['r2', 'future-release']));
  expect(mergeFacts(a, b)).toEqual(mergeFacts(b, a));
  expect(mergeFacts(merged, merged)).toEqual(merged);
  expect(parseFacts(serializeFacts(merged))).toEqual(merged);
});
it('reads old records without minimized releases and drops malformed members', () => {
  expect(parseFacts({v: 1, seen: ['a'], dismissed: ['r1']})).toEqual(
    facts(['a'], ['r1']),
  );
  expect(parseFacts({minimized: ['r2', null, 3]})).toEqual(
    facts([], [], ['r2']),
  );
});
