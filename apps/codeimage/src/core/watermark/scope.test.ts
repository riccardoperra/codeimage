// @vitest-environment happy-dom
import type * as solid from 'solid-js';
import type {EditorView} from '@codemirror/view';
import {createRoot} from 'solid-js';
import {expect, it, vi} from 'vitest';
import type {WatermarkScope} from './scope';
import {
  bindWatermarkExport,
  createWatermarkScope,
  prepareWatermark,
} from './scope';

vi.mock('solid-js', () =>
  vi.importActual<typeof solid>('solid-js/dist/solid.js'),
);

// happy-dom has no FontFaceSet; every font is already loaded here.
Object.defineProperty(document, 'fonts', {value: {ready: Promise.resolve()}});

const nextFrame = () =>
  new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function preview() {
  const target = document.createElement('div');
  const events: string[] = [];
  let scope!: WatermarkScope;
  const dispose = createRoot(dispose => {
    scope = createWatermarkScope();
    bindWatermarkExport(target, scope);
    return dispose;
  });
  const placeWithWatermark = () =>
    createRoot(disposeWatermark => {
      scope.attach('measure', () => {
        events.push('read');
        return () => events.push('write');
      });
      return disposeWatermark;
    });
  return {target, events, scope, dispose, placeWithWatermark};
}

it('resolves an export whose element has no preview', async () => {
  await expect(
    prepareWatermark(document.createElement('div')),
  ).resolves.toBeUndefined();
});

it('leaves a preview without a watermark untouched', async () => {
  const {target, scope, dispose} = preview();
  const fit = vi.fn();
  createRoot(() => scope.attach('fit', fit));
  await prepareWatermark(target);
  expect(fit).not.toHaveBeenCalled();
  dispose();
});

it('fits the window before it measures and applies the placement', async () => {
  const {target, events, scope, dispose, placeWithWatermark} = preview();
  createRoot(() => scope.attach('fit', () => events.push('fit')));
  placeWithWatermark();
  await prepareWatermark(target);
  expect(events).toEqual(['fit', 'read', 'write']);
  await nextFrame();
  expect(events).toEqual(['fit', 'read', 'write']);
  dispose();
});

it('prepares only the preview bound to the exported element', async () => {
  const first = preview();
  const second = preview();
  first.placeWithWatermark();
  second.placeWithWatermark();
  await prepareWatermark(second.target);
  expect(first.events).toEqual([]);
  expect(second.events).toEqual(['read', 'write']);
  first.dispose();
  second.dispose();
});

it('stops preparing a preview once it is disposed', async () => {
  const {target, events, dispose, placeWithWatermark} = preview();
  placeWithWatermark();
  dispose();
  await prepareWatermark(target);
  expect(events).toEqual([]);
});

it('measures once for several changes in the same frame', async () => {
  const {events, scope, dispose, placeWithWatermark} = preview();
  placeWithWatermark();
  scope.invalidate();
  scope.invalidate();
  await nextFrame();
  expect(events).toEqual(['read', 'write']);
  dispose();
});

it('keeps measuring after an editor with a queued request is removed', async () => {
  const {events, scope, dispose, placeWithWatermark} = preview();
  const requestMeasure = vi.fn();
  const view = {requestMeasure} as unknown as EditorView;
  const removeEditor = createRoot(dispose => {
    scope.attach('code', {kind: 'codemirror', view});
    return dispose;
  });
  placeWithWatermark();
  expect(requestMeasure).toHaveBeenCalled();
  const [queued] = requestMeasure.mock.lastCall!;

  removeEditor();
  await nextFrame();
  expect(events).toEqual(['read', 'write']);

  queued.write(queued.read());
  expect(events).toEqual(['read', 'write']);
  dispose();
});
