import {createRoot} from 'solid-js';
import {describe, expect, it, vi} from 'vitest';
import {createWhatsNew} from './whats-new.store';

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
    const {createSignal} = await import('solid-js');
    const db = database();
    const app = createRoot(dispose => {
      const store = createWhatsNew(db, Date.parse('2026-11-14'));
      const [quiet, setQuiet] = createSignal(false);
      return {store, setQuiet, announcement: store.announce(quiet), dispose};
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
      return {announcement: store.announce(() => true), dispose};
    });
    await settle();
    expect(next.announcement()).toBeNull();
    expect(await db.get('version')).toBeUndefined();
    app.dispose();
    next.dispose();
  });

  it('keeps facts from two tabs and refreshes them on focus', async () => {
    const db = database();
    const a = boot(db);
    const b = boot(db);
    await settle();
    a.store.seen('command-menu', 'coachmark');
    b.store.seen('layouts', 'use');
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

  it('reveals the location without consuming its pointer', async () => {
    const app = boot(database());
    await settle();
    let revealed = false;
    app.store.bindLocation('command-menu', () => {
      revealed = true;
    });
    app.store.opened('command-menu', 'library');
    app.store.showMe('command-menu', 'nudge');
    expect(revealed).toBe(true);
    expect(app.store.hasDot('command-menu')).toBe(true);
    app.store.seen('command-menu', 'coachmark');
    expect(app.store.hasDot('command-menu')).toBe(false);
    app.dispose();
  });
});
