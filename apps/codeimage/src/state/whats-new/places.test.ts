import type * as registry from './registry';
import type * as solid from 'solid-js';
import {createRoot} from 'solid-js';
import {expect, it, vi} from 'vitest';
import {holds} from './decide';
import {createWhatsNew} from './whats-new.store';

vi.mock('solid-js', () =>
  vi.importActual<typeof solid>('solid-js/dist/solid.js'),
);
vi.mock('./registry', async importOriginal => {
  const original = await importOriginal<typeof registry>();
  return {
    ...original,
    RELEASES: original.RELEASES.map(release => ({
      ...release,
      highlights: release.highlights.map(highlight =>
        highlight.id === 'command-menu'
          ? {...highlight, where: 'export:second'}
          : highlight,
      ),
    })),
  };
});
vi.stubGlobal('window', new EventTarget());

it('shows one dot per place and gives the next export item its turn within the three-dot cap', async () => {
  const app = createRoot(dispose => ({
    store: createWhatsNew(
      {get: async () => undefined, update: async () => {}, del: async () => {}},
      () => Date.parse('2026-11-14'),
    ),
    dispose,
  }));
  try {
    await new Promise(resolve => setTimeout(resolve, 0));
    const places = ['export', 'setting:layout', 'setting:theme-cards'] as const;
    const shown = () =>
      places.map(place => app.store.dotAt(place)).filter(Boolean);
    expect(app.store.dotAt('export')).toBe('tabs');
    expect(shown()).toEqual(['tabs', 'layouts']);
    app.store.seen('tabs');
    expect(app.store.dotAt('export')).toBe('command-menu');
    expect(shown()).toEqual(['command-menu', 'layouts', 'theme-cards']);
    app.store.seen('command-menu');
    expect(app.store.dotAt('export')).toBeUndefined();
    expect(shown()).toEqual(['layouts', 'theme-cards']);
  } finally {
    app.dispose();
  }
});

it('shares the same containment rule between a place and its items', () => {
  expect(holds('export', 'export:tabs')).toBe(true);
  expect(holds('export:tabs', 'export:tabs')).toBe(true);
  expect(holds('export:tabs', 'export:tabs-other')).toBe(false);
  expect(holds('setting', 'setting:layout')).toBe(true);
  expect(holds('command-menu', 'export:tabs')).toBe(false);
});
