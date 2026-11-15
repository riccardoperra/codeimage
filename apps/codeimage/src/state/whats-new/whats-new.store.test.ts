import type * as solid from 'solid-js';
import {createMemo, createRoot, createSignal, onCleanup} from 'solid-js';
import {describe, expect, expectTypeOf, it, vi} from 'vitest';
import type {LocatedHighlightId} from './registry';
import {createWhatsNew, type WhatsNew} from './whats-new.store';

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
    store: createWhatsNew(db, () => Date.parse('2026-11-14')),
    dispose,
  }));

describe('release discovery across visits', () => {
  it('waits for a quiet editor and keeps a shown announcement until dismissal', async () => {
    const db = database();
    const app = createRoot(dispose => {
      const store = createWhatsNew(db, () => Date.parse('2026-11-14'));
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
    expect(app.announcement()?.surface).toBe('showcase');
    app.setQuiet(false);
    expect(app.announcement()?.surface).toBe('showcase');
    app.store.dismiss();
    await settle();
    const next = createRoot(dispose => {
      const store = createWhatsNew(db, () => Date.parse('2026-11-14'));
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
      const store = createWhatsNew(db, () => Date.parse('2026-11-14'));
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
      createWhatsNew(db, () => Date.parse('2026-11-14')).announce(watch);
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
    for (const id of [
      'tabs',
      'social',
      'signature',
      'marks',
      'alt',
      'window-styles',
    ] as const)
      a.store.seen(id);
    a.store.seen('command-menu');
    b.store.seen('layouts');
    const reloaded = boot(db);
    await settle();
    expect(reloaded.store.dotAt('command-menu')).toBeUndefined();
    expect(reloaded.store.dotAt('setting:layout')).toBeUndefined();
    expect(reloaded.store.dotAt('setting:theme-cards')).toBe('theme-cards');
    window.dispatchEvent(new Event('focus'));
    await settle();
    expect(a.store.isNew('layouts')).toBe(false);
    expect(b.store.isNew('command-menu')).toBe(false);
    a.dispose();
    b.dispose();
    reloaded.dispose();
  });

  it('closes a shown release on focus after another tab dismisses it without recording again', async () => {
    const db = database();
    const update = vi.spyOn(db, 'update');
    const track = vi.fn();
    Object.assign(window, {umami: {track}});
    const visit = () =>
      createRoot(dispose => {
        const store = createWhatsNew(db, () => Date.parse('2026-11-14'));
        return {store, announcement: store.announce(() => () => true), dispose};
      });
    const a = visit();
    const b = visit();
    try {
      await settle();
      expect(a.announcement()).not.toBeNull();
      expect(b.announcement()).not.toBeNull();
      a.store.dismiss();
      await settle();
      const writes = update.mock.calls.length;
      const dismissals = () =>
        track.mock.calls.filter(([event]) => event === 'whats-new-dismissed');
      expect(dismissals()).toHaveLength(1);
      window.dispatchEvent(new Event('focus'));
      await settle();
      expect(b.announcement()).toBeNull();
      expect(update).toHaveBeenCalledTimes(writes);
      expect(dismissals()).toHaveLength(1);
    } finally {
      a.dispose();
      b.dispose();
      Reflect.deleteProperty(window, 'umami');
    }
  });

  it('expires tags, dots and a waiting announcement on focus during a long visit', async () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(Date.parse('2026-12-28T23:59:59Z'));
    const app = createRoot(dispose => {
      const store = createWhatsNew(database());
      const [quiet, setQuiet] = createSignal(false);
      return {
        store,
        setQuiet,
        announcement: store.announce(() => quiet),
        dispose,
      };
    });
    try {
      await settle();
      expect(app.store.isNew('tabs')).toBe(true);
      expect(app.store.dotAt('export:tabs')).toBe('tabs');
      now.mockReturnValue(Date.parse('2026-12-29T00:00:00Z'));
      window.dispatchEvent(new Event('focus'));
      await settle();
      expect(app.store.isNew('tabs')).toBe(false);
      expect(app.store.dotAt('export:tabs')).toBeUndefined();
      app.setQuiet(true);
      expect(app.announcement()).toBeNull();
    } finally {
      app.dispose();
      now.mockRestore();
    }
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
      const store = createWhatsNew(refusing, () => Date.parse('2026-11-14'));
      return {store, announcement: store.announce(() => () => true), dispose};
    });
    await settle();
    expect(app.announcement()?.surface).toBe('showcase');
    expect(() => app.store.seen('command-menu')).not.toThrow();
    expect(app.store.dotAt('command-menu')).toBeUndefined();
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
    await settle();
    expect(app.store.revealedAt('command-menu')).toBe('command-menu');
    expect(app.store.isNew('command-menu')).toBe(true);
    app.store.seen('command-menu');
    expect(app.store.dotAt('command-menu')).toBeUndefined();
    unbind();
    expect(app.store.canShowMe('command-menu')).toBe(false);
    app.dispose();
  });
});

it('only accepts located highlights for Show me', () => {
  expectTypeOf<
    Parameters<WhatsNew['showMe']>[0]
  >().toEqualTypeOf<LocatedHighlightId>();
  expectTypeOf<
    Parameters<WhatsNew['canShowMe']>[0]
  >().toEqualTypeOf<LocatedHighlightId>();
});

it('resolves items by their most specific owner and rejects duplicate owners', async () => {
  const app = boot(database());
  await settle();
  expect(app.store.canShowMe('layouts')).toBe(false);
  const reveal = vi.fn();
  const exact = vi.fn();
  const unbind = createRoot(dispose => {
    app.store.bindLocation('setting', reveal);
    app.store.bindLocation('setting:layout', exact);
    return dispose;
  });
  expect(() =>
    createRoot(() => app.store.bindLocation('setting', vi.fn())),
  ).toThrow('already has an owner');
  app.store.showMe('layouts', 'library');
  expect(exact).toHaveBeenCalledWith(undefined);
  expect(reveal).not.toHaveBeenCalled();
  app.store.showMe('theme-cards', 'library');
  expect(reveal).toHaveBeenCalledWith('theme-cards');
  expect(app.store.isNew('layouts')).toBe(true);
  unbind();
  expect(app.store.canShowMe('layouts')).toBe(false);
  app.dispose();
});

it('hands a place to the owner that replaces another in the same update', async () => {
  const app = boot(database());
  await settle();
  const [placement, setPlacement] = createSignal<'header' | 'layout'>('header');
  const header = vi.fn();
  const layout = vi.fn();
  const dispose = createRoot(dispose => {
    // The new placement is created before the old one is disposed.
    createMemo(
      () =>
        placement() === 'layout' && app.store.bindLocation('export', layout),
    );
    createMemo(
      () =>
        placement() === 'header' && app.store.bindLocation('export', header),
    );
    return dispose;
  });
  setPlacement('layout');
  app.store.showMe('tabs', 'library');
  expect(layout).toHaveBeenCalled();
  expect(header).not.toHaveBeenCalled();
  dispose();
  expect(app.store.canShowMe('tabs')).toBe(false);
  app.dispose();
});

it('waits for control panels to reveal, opens a temporary coachmark and preserves seen facts', async () => {
  const app = boot(database());
  await settle();
  let finish!: () => void;
  const reveal = vi.fn(
    () =>
      new Promise<void>(resolve => {
        finish = resolve;
      }),
  );
  const unbind = createRoot(dispose => {
    app.store.bindLocation('control', reveal);
    return dispose;
  });
  expect(app.store.canShowMe('window-styles')).toBe(true);
  app.store.showMe('window-styles', 'showcase');
  expect(reveal).toHaveBeenCalledWith('window.style');
  expect(app.store.revealedAt('control:window.style')).toBeUndefined();
  finish();
  await settle();
  expect(app.store.revealedAt('control:window.style')).toBe('window-styles');
  expect(app.store.isNew('window-styles')).toBe(true);
  expect(app.store.dotAt('control:signature.saved')).toBe('signature');
  expect(app.store.dotAt('control:window.style')).toBeUndefined();
  app.store.endReveal('window-styles');
  expect(app.store.dotAt('control:signature.saved')).toBe('signature');
  unbind();
  expect(app.store.canShowMe('window-styles')).toBe(false);
  app.dispose();
});

it('binds editor places and lets the most recent Show me request win', async () => {
  const app = boot(database());
  await settle();
  let finish!: () => void;
  const unbind = createRoot(dispose => {
    app.store.bindLocation(
      'control',
      () =>
        new Promise<void>(resolve => {
          finish = resolve;
        }),
    );
    app.store.bindLocation('editor', vi.fn());
    return dispose;
  });
  app.store.showMe('social', 'library');
  app.store.showMe('marks', 'library');
  await settle();
  finish();
  await settle();
  expect(app.store.revealedAt('editor:line-marks')).toBe('marks');
  expect(app.store.revealedAt('control:frame.aspectRatio')).toBeUndefined();
  app.store.seen('marks');
  expect(app.store.revealedAt('editor:line-marks')).toBeUndefined();
  expect(app.store.isNew('marks')).toBe(false);
  unbind();
  app.dispose();
});
