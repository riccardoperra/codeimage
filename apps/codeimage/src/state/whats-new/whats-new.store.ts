import {getUmami} from '../../core/constants/umami';
import * as idb from 'idb-keyval';
import type {Accessor} from 'solid-js';
import {
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import type {Decision, Facts} from './decide';
import {
  decide,
  holds,
  mergeFacts,
  NO_FACTS,
  parseFacts,
  serializeFacts,
} from './decide';
import type {HighlightId, LocatedHighlightId, Place, Where} from './registry';
import {RELEASES} from './registry';

export type Surface = 'nudge' | 'showcase' | 'coachmark' | 'library';
type Announcement =
  | (NonNullable<Decision<(typeof RELEASES)[number]>['announcement']> & {
      readonly entry: 'automatic' | 'pointer' | 'keyboard' | 'preview';
    })
  | null;

export interface WhatsNew {
  /**
   * `watchQuiet` runs only while a release waits to be shown, and its owner is
   * disposed as soon as the release shows or stops waiting, so whatever it
   * observes costs nothing on a visit with nothing to announce.
   */
  announce(
    watchQuiet: () => Accessor<boolean>,
    preview?: 'nudge' | 'showcase',
  ): Accessor<Announcement>;
  readonly current: Accessor<Announcement>;
  readonly headerEntry: Accessor<boolean>;
  readonly headerUnread: Accessor<boolean>;
  /** Reopens the newest release for this session without changing facts. */
  reopen(keyboard?: boolean): void;
  dismiss(): void;
  dotAt(at: Where): LocatedHighlightId | undefined;
  isNew(id: HighlightId): boolean;
  opened(id: HighlightId, on: Surface): void;
  seen(id: HighlightId): void;
  /** True while the component that owns the highlight's place is mounted. */
  canShowMe(id: LocatedHighlightId): boolean;
  showMe(id: LocatedHighlightId, from: Surface): void;
  /**
   * Binds once the caller is mounted and unbinds when it is disposed. A
   * placement or route that replaces another is created before the old one
   * is disposed, and mounted after.
   */
  bindLocation(
    place: Place | Where,
    reveal: (item: string | undefined) => void,
  ): void;
}

interface Storage {
  get(key: string): Promise<unknown>;
  update(key: string, updater: (raw: unknown) => unknown): Promise<void>;
  del(key: string): Promise<void>;
}

function track(
  event: 'shown' | 'dismissed' | 'opened' | 'show-me' | 'reopened',
  data:
    | {surface: Surface; release: string}
    | {surface: Surface; highlight: HighlightId},
) {
  getUmami().track(`whats-new-${event}`, data);
}

export function createWhatsNew(
  storage: Storage = idb,
  clock = Date.now,
): WhatsNew {
  const [now, setNow] = createSignal(clock());
  const [facts, setFacts] = createSignal<Facts>(NO_FACTS);
  const [loaded, setLoaded] = createSignal(false);
  const [announcement, setAnnouncement] = createSignal<Announcement>(null);
  const [locations, setLocations] = createSignal<
    ReadonlyMap<Place | Where, (item: string | undefined) => void>
  >(new Map());
  const decision = createMemo(() =>
    decide(loaded() ? RELEASES : [], facts(), now()),
  );
  const pending = createMemo(() => decision().announcement, null, {
    equals: (a, b) => a?.release.id === b?.release.id,
  });
  const whereOf = (id: HighlightId) =>
    RELEASES.flatMap(release => release.highlights).find(
      highlight => highlight.id === id,
    )?.where ?? null;

  const bound = (id: LocatedHighlightId) => {
    const where = whereOf(id);
    if (where === null) return;
    return [...locations()]
      .filter(([place]) => holds(place, where))
      .sort(([a], [b]) => b.length - a.length)
      .map(([place, reveal]) => ({
        reveal,
        item: where === place ? undefined : where.slice(place.length + 1),
      }))[0];
  };

  // idb-keyval opens the database synchronously, so a browser that refuses
  // IndexedDB throws instead of rejecting. Editing must go on either way.
  const attempt = <T>(work: () => Promise<T>) => Promise.resolve().then(work);

  async function load() {
    setNow(clock());
    try {
      const raw = await attempt(() => storage.get('whats-new'));
      setFacts(current => mergeFacts(current, parseFacts(raw)));
      const current = announcement();
      if (
        current?.entry === 'automatic' &&
        facts().dismissed.has(current.release.id)
      ) {
        setAnnouncement(null);
      }
    } catch {
      // No stored facts: the worst case is one repeated announcement.
    } finally {
      setLoaded(true);
    }
  }

  function record(delta: Facts) {
    setFacts(current => mergeFacts(current, delta));
    attempt(() =>
      storage.update('whats-new', raw =>
        serializeFacts(mergeFacts(parseFacts(raw), delta)),
      ),
    ).catch(() => {});
  }

  void load();
  // The record of the former changelog, which nothing reads any more.
  attempt(() => storage.del('version')).catch(() => {});
  window.addEventListener('focus', load);
  onCleanup(() => window.removeEventListener('focus', load));

  return {
    current: announcement,
    headerEntry: () =>
      decision().headerEntry && announcement()?.surface !== 'showcase',
    headerUnread: () =>
      !announcement() &&
      RELEASES[0].highlights.some(highlight =>
        decision().fresh.has(highlight.id),
      ),
    reopen(keyboard = false) {
      if (!decision().headerEntry || announcement()) return;
      const release = RELEASES[0];
      setAnnouncement({
        surface: 'nudge',
        release,
        entry: keyboard ? 'keyboard' : 'pointer',
      });
      track('reopened', {surface: 'nudge', release: release.id});
    },
    announce(watchQuiet, preview) {
      if (preview) {
        setAnnouncement({
          surface: preview,
          release: RELEASES[0],
          entry: 'preview',
        });
        return announcement;
      }
      createEffect(() => {
        const release = pending();
        if (!release || announcement()) return;
        const quiet = watchQuiet();
        createEffect(() => {
          if (!quiet()) return;
          setAnnouncement({...release, entry: 'automatic'});
          track('shown', {
            surface: release.surface,
            release: release.release.id,
          });
        });
      });
      return announcement;
    },
    dismiss() {
      const current = announcement();
      if (!current) return;
      record({seen: new Set(), dismissed: new Set([current.release.id])});
      setAnnouncement(null);
      track('dismissed', {
        surface: current.surface,
        release: current.release.id,
      });
    },
    dotAt: at =>
      RELEASES.flatMap(release => release.highlights)
        .filter(highlight => highlight.where !== null)
        .find(
          highlight =>
            holds(at, highlight.where) &&
            decision().dots.includes(highlight.id),
        )?.id,
    isNew: id => decision().fresh.has(id),
    opened: (id, surface) => track('opened', {surface, highlight: id}),
    seen(id) {
      record({seen: new Set([id]), dismissed: new Set()});
    },
    canShowMe: id => bound(id) !== undefined,
    showMe(id, surface) {
      track('show-me', {surface, highlight: id});
      const location = bound(id);
      location?.reveal(location.item);
    },
    bindLocation(where, reveal) {
      onMount(() => {
        if (locations().has(where)) {
          if (import.meta.env.DEV)
            throw new Error(`What's new place "${where}" already has an owner`);
          return;
        }
        setLocations(current => new Map(current).set(where, reveal));
      });
      onCleanup(() =>
        setLocations(current => {
          if (current.get(where) !== reveal) return current;
          const next = new Map(current);
          next.delete(where);
          return next;
        }),
      );
    },
  };
}

let instance: WhatsNew | undefined;
export function getWhatsNew(): WhatsNew {
  return (instance ??= createRoot(() => createWhatsNew()));
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.resetWhatsNew = () => idb.del('whats-new');
}

declare global {
  interface Window {
    resetWhatsNew?: () => Promise<void>;
  }
}
