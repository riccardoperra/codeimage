import type * as solid from 'solid-js';
import {createRoot, createSignal, onCleanup} from 'solid-js';
import {describe, expect, it, vi} from 'vitest';
import {createWhatsNew} from './whats-new.store';

// The suite renders snapshots with Solid's server build, where signals never
// update. The store runs in the browser, so it gets the browser build here.
vi.mock('solid-js', () =>
  vi.importActual<typeof solid>('solid-js/dist/solid.js'),
);
vi.stubGlobal('window', new EventTarget());

function database() {
  const records = new Map<string, unknown>([['version', {seen: ['1.9']}]]);
  return {
    get: async (key: string) => records.get(key),
    del: async (key: string) => {
      records.delete(key);
    },
    update: async (key: string, updater: (raw: unknown) => unknown) => {
      records.set(key, updater(records.get(key)));
    },
  };
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0));
const boot = (db: ReturnType<typeof database>) =>
  createRoot(dispose => ({
    store: createWhatsNew(db, Date.parse('2026-11-14')),
    dispose,
  }));

describe('release discovery across visits', () => {
  it('waits for a quiet editor and keeps a shown announcement until dismissal', async () => {
    const db = database();
    const app = createRoot(dispose => {
      const store = createWhatsNew(db, Date.parse('2026-11-14'));
      const [quiet, setQuiet] = createSignal(false);
      return {
        store,
        setQuiet,
        announcement: store.announce(() => quiet),
        dispose,
      };
    });
    await settle();
    expect(app.announcement()).toBeNull();
    app.setQuiet(true);
    expect(app.announcement()?.surface).toBe('nudge');
    app.setQuiet(false);
    expect(app.announcement()?.surface).toBe('nudge');
    app.store.dismiss();
    await settle();
    const next = createRoot(dispose => {
      const store = createWhatsNew(db, Date.parse('2026-11-14'));
      return {announcement: store.announce(() => () => true), dispose};
    });
    await settle();
    expect(next.announcement()).toBeNull();
    expect(await db.get('version')).toBeUndefined();
    app.dispose();
    next.dispose();
  });

  it('watches for a quiet moment only while a release waits to be shown', async () => {
    const db = database();
    const [quiet, setQuiet] = createSignal(false);
    let watching = 0;
    const watch = () => {
      watching++;
      onCleanup(() => watching--);
      return quiet;
    };
    const first = createRoot(dispose => {
      const store = createWhatsNew(db, Date.parse('2026-11-14'));
      return {announcement: store.announce(watch), store, dispose};
    });
    await settle();
    expect(watching).toBe(1);
    setQuiet(true);
    expect(first.announcement()).not.toBeNull();
    expect(watching).toBe(0);
    first.store.dismiss();
    await settle();
    const returning = createRoot(dispose => {
      createWhatsNew(db, Date.parse('2026-11-14')).announce(watch);
      return dispose;
    });
    await settle();
    expect(watching).toBe(0);
    first.dispose();
    returning();
  });

  it('keeps facts from two tabs and refreshes them on focus', async () => {
    const db = database();
    const a = boot(db);
    const b = boot(db);
    await settle();
    a.store.seen('command-menu');
    b.store.seen('layouts');
    const reloaded = boot(db);
    await settle();
    expect(reloaded.store.hasDot('command-menu')).toBe(false);
    expect(reloaded.store.hasDot('layouts')).toBe(false);
    expect(reloaded.store.hasDot('theme-cards')).toBe(true);
    window.dispatchEvent(new Event('focus'));
    await settle();
    expect(a.store.isNew('layouts')).toBe(false);
    expect(b.store.isNew('command-menu')).toBe(false);
    a.dispose();
    b.dispose();
    reloaded.dispose();
  });

  it('keeps working when the browser refuses storage', async () => {
    const refusing = {
      get: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      update: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      del: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    };
    const app = createRoot(dispose => {
      const store = createWhatsNew(refusing, Date.parse('2026-11-14'));
      return {store, announcement: store.announce(() => () => true), dispose};
    });
    await settle();
    expect(app.announcement()?.surface).toBe('nudge');
    expect(() => app.store.seen('command-menu')).not.toThrow();
    expect(app.store.hasDot('command-menu')).toBe(false);
    expect(() => app.store.dismiss()).not.toThrow();
    expect(app.announcement()).toBeNull();
    await settle();
    app.dispose();
  });

  it('reveals the location without consuming its pointer', async () => {
    const app = boot(database());
    await settle();
    let revealed = false;
    const unbind = createRoot(dispose => {
      app.store.bindLocation('command-menu', () => {
        revealed = true;
      });
      return dispose;
    });
    expect(app.store.canShowMe('command-menu')).toBe(true);
    app.store.showMe('command-menu', 'nudge');
    expect(revealed).toBe(true);
    expect(app.store.hasDot('command-menu')).toBe(true);
    app.store.seen('command-menu');
    expect(app.store.hasDot('command-menu')).toBe(false);
    unbind();
    expect(app.store.canShowMe('command-menu')).toBe(false);
    app.dispose();
  });
});
