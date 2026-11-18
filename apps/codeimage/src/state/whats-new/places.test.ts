import type {UnifiedWhere} from '../../pages/UnifiedEditor/places';
import type * as registry from './registry';
import type * as solid from 'solid-js';
import {createRoot, flush} from 'solid-js';
import {expect, expectTypeOf, it, vi} from 'vitest';
import {createWhatsNew} from './whats-new.store';

vi.mock('solid-js', () =>
  vi.importActual<typeof solid>(
    new URL('./dist/solid.js', import.meta.resolve('solid-js/package.json'))
      .pathname,
  ),
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
      {
        get: async () => ({
          seen: [
            'social',
            'signature',
            'marks',
            'alt',
            'window-styles',
            'takumi',
          ],
        }),
        update: async () => {},
        del: async () => {},
      },
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
    flush();
    expect(app.store.dotAt('export')).toBe('command-menu');
    expect(shown()).toEqual(['command-menu', 'layouts', 'theme-cards']);
    app.store.seen('command-menu');
    flush();
    expect(app.store.dotAt('export')).toBeUndefined();
    expect(shown()).toEqual(['layouts', 'theme-cards']);
  } finally {
    app.dispose();
  }
});

it('draws a highlight only at its place or the place that contains it', async () => {
  const app = createRoot(dispose => ({
    store: createWhatsNew(
      {
        get: async () => ({
          seen: [
            'social',
            'signature',
            'marks',
            'alt',
            'window-styles',
            'takumi',
          ],
        }),
        update: async () => {},
        del: async () => {},
      },
      () => Date.parse('2026-11-14'),
    ),
    dispose,
  }));
  try {
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(app.store.dotAt('export:second')).toBe('command-menu');
    expect(app.store.dotAt('export:tabs')).toBe('tabs');
    expect(app.store.dotAt('export:tab')).toBeUndefined();
    expect(app.store.dotAt('command-menu')).toBeUndefined();
    expect(app.store.dotAt('setting:layout')).toBe('layouts');
  } finally {
    app.dispose();
  }
});

it('places the release controls and the shared line-marks UI in registry order', async () => {
  const app = createRoot(dispose => ({
    store: createWhatsNew(
      {get: async () => undefined, update: async () => {}, del: async () => {}},
      () => Date.parse('2026-11-14'),
    ),
    dispose,
  }));
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(app.store.dotAt('setting:layout')).toBe('layouts');
  expect(app.store.dotAt('setting:rendering-engine')).toBe('takumi');
  expect(app.store.dotAt('control:frame.aspectRatio')).toBeUndefined();
  expect(app.store.dotAt('control:signature.saved')).toBeUndefined();
  expect(app.store.dotAt('editor:line-marks')).toBe('marks');
  expect(app.store.dotAt('control:window.style')).toBeUndefined();
  app.store.seen('marks');
  flush();
  expect(app.store.dotAt('control:signature.saved')).toBe('signature');
  expect(app.store.dotAt('control:window.style')).toBeUndefined();
  app.store.seen('layouts');
  flush();
  expect(app.store.dotAt('control:window.style')).toBe('window-styles');
  expect(app.store.dotAt('editor:line-mark')).toBeUndefined();
  app.dispose();
});

it('accepts only shared editor locations and real control ids', () => {
  expectTypeOf<'editor:line-marks'>().toExtend<UnifiedWhere>();
  expectTypeOf<'control:signature.saved'>().toExtend<UnifiedWhere>();
  expectTypeOf<'editor:missing'>().not.toExtend<UnifiedWhere>();
  expectTypeOf<'control:missing'>().not.toExtend<UnifiedWhere>();
});
