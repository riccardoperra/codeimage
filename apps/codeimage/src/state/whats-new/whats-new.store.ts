import {getUmami} from '../../core/constants/umami';
import * as idb from 'idb-keyval';
import type {Accessor} from 'solid-js';
import {
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  onCleanup,
  untrack,
} from 'solid-js';
import type {Decision, Facts} from './decide';
import {
  decide,
  mergeFacts,
  NO_FACTS,
  parseFacts,
  serializeFacts,
} from './decide';
import type {HighlightId, LocatedHighlightId, Where} from './registry';
import {RELEASES} from './registry';

export type Surface = 'nudge' | 'showcase' | 'coachmark' | 'library';
type Announcement = Decision['announcement'];

export interface WhatsNew {
  announce(quiet: Accessor<boolean>): Accessor<Announcement>;
  dismiss(): void;
  hasDot(id: LocatedHighlightId): boolean;
  isNew(id: HighlightId): boolean;
  opened(id: HighlightId, on: Surface): void;
  seen(id: HighlightId, by: 'coachmark' | 'use'): void;
  showMe(id: LocatedHighlightId, from: Surface): void;
  bindLocation(where: Where, reveal: () => void): void;
}

interface Storage {
  get(key: string): Promise<unknown>;
  update(key: string, updater: (raw: unknown) => unknown): Promise<void>;
  del(key: string): Promise<void>;
}

function track(
  event: 'shown' | 'dismissed' | 'opened' | 'show-me',
  data:
    | {surface: Surface; release: string}
    | {surface: Surface; highlight: HighlightId},
) {
  getUmami().track(`whats-new-${event}`, data);
}

export function createWhatsNew(
  storage: Storage = idb,
  now = Date.now(),
): WhatsNew {
  const [facts, setFacts] = createSignal<Facts>(NO_FACTS);
  const [loaded, setLoaded] = createSignal(false);
  const [announcement, setAnnouncement] = createSignal<Announcement>(null);
  const locations = new Map<Where, () => void>();
  const decision = createMemo(() =>
    decide(loaded() ? RELEASES : [], facts(), now),
  );

  async function load() {
    try {
      const raw = await storage.get('whats-new');
      setFacts(current => mergeFacts(current, parseFacts(raw)));
      await storage.del('version');
    } catch {
      // Editing remains available when browser storage is disabled.
    } finally {
      setLoaded(true);
    }
  }

  function record(delta: Facts) {
    setFacts(current => mergeFacts(current, delta));
    void storage
      .update('whats-new', raw =>
        serializeFacts(mergeFacts(parseFacts(raw), delta)),
      )
      .catch(() => {});
  }

  void load();
  window.addEventListener('focus', load);
  onCleanup(() => window.removeEventListener('focus', load));

  return {
    announce(quiet) {
      createEffect(() => {
        const pending = decision().announcement;
        if (!quiet() || !pending || untrack(announcement)) return;
        setAnnouncement(pending);
        track('shown', {surface: pending.surface, release: pending.release.id});
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
    hasDot: id => loaded() && decision().dots.includes(id),
    isNew: id => loaded() && decision().fresh.has(id),
    opened: (id, surface) => track('opened', {surface, highlight: id}),
    seen(id, _by) {
      record({seen: new Set([id]), dismissed: new Set()});
    },
    showMe(id, surface) {
      track('show-me', {surface, highlight: id});
      const highlight = RELEASES.flatMap(release => release.highlights).find(
        highlight => highlight.id === id,
      );
      if (highlight) locations.get(highlight.where)?.();
    },
    bindLocation: (where, reveal) => {
      locations.set(where, reveal);
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
