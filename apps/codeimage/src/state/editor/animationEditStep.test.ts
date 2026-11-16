// @vitest-environment happy-dom
import assert from 'node:assert/strict';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import type * as Solid from 'solid-js';
import {createRoot, createSignal} from 'solid-js';
import {test, vi} from 'vitest';
import {createAnimationStore} from './animation';
vi.mock('solid-js', () =>
  vi.importActual<typeof Solid>('solid-js/dist/solid.js'),
);

test('edit step waits for a reused view to synchronize and preserves read-only code', () => {
  const parent = document.createElement('div');
  document.body.append(parent);
  const view = new EditorView({
    parent,
    state: EditorState.create({doc: 'first'}),
  });
  const fixture = createRoot(dispose => {
    const [id, setId] = createSignal('a');
    const [viewId, setViewId] = createSignal('a');
    const editors = ['a', 'b'].map(id => ({
      id,
      code: id === 'a' ? 'first' : 'second',
      languageId: 'plaintext',
      lineNumberStart: 1,
      marks: {lines: [], focusedLines: []},
      tab: {tabName: `${id}.txt`},
    }));
    const animation = createAnimationStore({
      state: {
        editors,
        get activeEditorId() {
          return id();
        },
      },
      activeEditorView: () => view,
      activeEditorViewTabId: viewId,
      computed: {canAddEditor: () => false},
      actions: {
        setActiveEditorId: setId,
        addEditor: () => undefined,
        removeEditor: () => undefined,
        setEditors: () => undefined,
      },
    });
    animation.actions.setOpen(true);
    return {animation, setViewId, dispose};
  });
  try {
    fixture.animation.actions.editStep(1, 'X');
    assert.equal(view.state.doc.toString(), 'first');
    view.setState(EditorState.create({doc: 'second'}));
    fixture.setViewId('b');
    assert.equal(view.state.doc.toString(), 'Xsecond');
    assert.ok(view.hasFocus);
    fixture.animation.actions.editStep(0, 'stale');
    fixture.animation.actions.seek(100);
    view.setState(EditorState.create({doc: 'first'}));
    fixture.setViewId('a');
    assert.equal(view.state.doc.toString(), 'first');
    view.setState(
      EditorState.create({
        doc: 'read only',
        extensions: EditorState.readOnly.of(true),
      }),
    );
    fixture.animation.actions.editStep(0, 'Y');
    assert.equal(view.state.doc.toString(), 'read only');
    assert.ok(view.hasFocus);
  } finally {
    fixture.dispose();
    view.destroy();
    parent.remove();
  }
});
