import assert from 'node:assert/strict';
import type * as Solid from 'solid-js';
import {createRoot, createSignal, flush} from 'solid-js';
import {test, vi} from 'vitest';
import {
  EMPTY_DRAFT,
  reconcileSteps,
} from '../../state/editor/animationSettings';
import {
  createPreviewSnapshot,
  type PreviewRequest,
} from './createPreviewSnapshot';
import type {PreviewMeasurement} from './planPreview';

vi.mock('solid-js', () =>
  vi.importActual<typeof Solid>(
    new URL('./dist/solid.js', import.meta.resolve('solid-js/package.json'))
      .pathname,
  ),
);

const request = (ids: readonly [string, ...string[]]): PreviewRequest => {
  const tab = (id: string) => ({
    id,
    code: id,
    languageId: 'plaintext',
    lineNumberStart: 1,
    marks: {lines: [], focusedLines: []},
    tabName: id,
  });
  const [first, ...rest] = ids;
  return {
    key: ids.join(','),
    settings: reconcileSteps(EMPTY_DRAFT, [tab(first), ...rest.map(tab)]),
    tabs: [tab(first), ...rest.map(tab)],
    style: {
      theme: {
        id: 'test',
        editorTheme: [],
        properties: {
          label: '',
          previewBackground: '',
          darkMode: true,
          terminal: {main: '#000', text: '#fff'},
        },
      },
      fontFamily: 'monospace',
      fontWeight: 400,
      enableLigatures: false,
      showLineNumbers: false,
    },
  };
};
const measured = (request: PreviewRequest): PreviewMeasurement => {
  const step = () => ({
    layout: {size: {width: 100, height: 60}, window: null},
    lines: [],
    marks: {lines: [], focusedLines: []},
    lineNumberStart: 1,
  });
  return {
    tabs: [...request.tabs],
    languages: request.tabs.map(() => null),
    steps: [step(), ...request.tabs.slice(1).map(step)],
    metrics: {charWidth: 8, lineHeight: 16},
    widths: new Map(),
    windowAreas: request.tabs.map(() => 0),
    lineNumbers: false,
  };
};
const complete = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  flush();
};

for (const removed of ['a', 'b', 'c'])
  test(`removing step ${removed} never pairs new settings with the previous measurement`, async () => {
    const fixture = createRoot(dispose => {
      const initial = request(['a', 'b', 'c']);
      const [current, setCurrent] = createSignal(initial);
      const pending = new Map<string, (value: PreviewMeasurement) => void>();
      const {snapshot} = createPreviewSnapshot(
        current,
        value => new Promise(resolve => pending.set(value.key, resolve)),
      );
      return {dispose, initial, setCurrent, pending, snapshot};
    });
    try {
      fixture.pending.get(fixture.initial.key)!(measured(fixture.initial));
      await complete();
      assert.equal(fixture.snapshot()?.measured.tabs.length, 3);
      const ids = ['a', 'b', 'c'].filter(id => id !== removed);
      const next = request([ids[0], ids[1]]);
      fixture.setCurrent(next);
      flush();
      assert.equal(fixture.snapshot(), undefined);
      fixture.pending.get(next.key)!(measured(next));
      await complete();
      const snapshot = fixture.snapshot()!;
      assert.deepEqual(
        snapshot.measured.tabs.map(tab => tab.id),
        ids,
      );
      assert.deepEqual(
        snapshot.settings.steps.map(step => step.editorId),
        ids,
      );
      fixture.setCurrent({
        ...next,
        settings: {...next.settings, transitionMs: 1500},
      });
      flush();
      assert.equal(fixture.snapshot()?.settings.transitionMs, 1500);
      assert.equal(fixture.snapshot()?.measured, snapshot.measured);
      assert.equal(fixture.pending.size, 2, 'timing changes reuse measurement');
    } finally {
      fixture.dispose();
    }
  });

test('a late measurement cannot restore a removed step', async () => {
  const fixture = createRoot(dispose => {
    const first = request(['a', 'b', 'c']);
    const [current, setCurrent] = createSignal(first);
    const pending = new Map<string, (value: PreviewMeasurement) => void>();
    const {snapshot} = createPreviewSnapshot(
      current,
      value => new Promise(resolve => pending.set(value.key, resolve)),
    );
    return {dispose, first, setCurrent, pending, snapshot};
  });
  try {
    const next = request(['a', 'c']);
    fixture.setCurrent(next);
    flush();
    fixture.pending.get(next.key)!(measured(next));
    await complete();
    fixture.pending.get(fixture.first.key)!(measured(fixture.first));
    await complete();
    assert.deepEqual(
      fixture.snapshot()?.measured.tabs.map(tab => tab.id),
      ['a', 'c'],
    );
  } finally {
    fixture.dispose();
  }
});
