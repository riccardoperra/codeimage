// @vitest-environment happy-dom
import type * as solid from 'solid-js';
import {EditorView} from '@codemirror/view';
import {EditorSelection, EditorState} from '@codemirror/state';
import {lineAtHeight} from '../../components/CustomEditor/plugins/lineMarks/controls';
import {createRoot} from 'solid-js';
import {expect, it, vi} from 'vitest';
import type {WatermarkScope} from './scope';
import {
  bindWatermarkExport,
  codeRects,
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

it('measures live text through CodeMirror coordinates and leaves static markup to its reader', () => {
  const view = new EditorView({
    state: EditorState.create({doc: '  word  \n   \nlast one'}),
    parent: document.body,
  });
  const coordinates = vi.spyOn(view, 'coordsAtPos').mockImplementation(pos => ({
    left: pos * 10,
    right: pos * 10,
    top: 0,
    bottom: 20,
  }));
  const staticRects = vi.fn(() => [{x: 1, y: 2, width: 3, height: 4}]);
  try {
    expect(codeRects({kind: 'codemirror', view}, staticRects)).toEqual([
      {x: 20, y: 0, width: 40, height: 20},
      {x: 130, y: 0, width: 40, height: 20},
      {x: 180, y: 0, width: 30, height: 20},
    ]);
    expect(staticRects).not.toHaveBeenCalled();
    coordinates.mockRestore();
    const root = document.createElement('div');
    root.innerHTML = '<div class="cm-line">static</div>';
    expect(codeRects({kind: 'static', root}, staticRects)).toEqual([
      {x: 1, y: 2, width: 3, height: 4},
    ]);
    expect(staticRects).toHaveBeenCalledOnce();
  } finally {
    view.destroy();
  }
});

it('splits a live word that wraps onto the next row', () => {
  const view = new EditorView({doc: 'abcdefgh', parent: document.body});
  const row = (pos: number, side = 1) =>
    pos > 4 || (pos === 4 && side > 0) ? 1 : 0;
  vi.spyOn(view, 'coordsAtPos').mockImplementation((pos, side) => {
    const left = (pos - row(pos, side) * 4) * 10;
    const top = row(pos, side) * 20;
    return {left, right: left, top, bottom: top + 20};
  });
  vi.spyOn(view, 'moveToLineBoundary').mockImplementation(start =>
    EditorSelection.cursor(start.head < 4 ? 4 : 8),
  );
  try {
    expect(codeRects({kind: 'codemirror', view}, () => [])).toEqual([
      {x: 0, y: 0, width: 40, height: 20},
      {x: 0, y: 20, width: 40, height: 20},
    ]);
  } finally {
    view.destroy();
  }
});

it('clamps gutter pointer positions past both ends of the document', () => {
  const view = new EditorView({doc: 'one\ntwo\nthree', parent: document.body});
  try {
    expect(lineAtHeight(view, view.documentTop - 10000)).toBe(1);
    expect(lineAtHeight(view, view.documentTop + 10000)).toBe(3);
  } finally {
    view.destroy();
  }
});
