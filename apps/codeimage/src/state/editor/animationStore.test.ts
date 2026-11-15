import type * as Solid from 'solid-js';
import assert from 'node:assert/strict';
import {test, vi} from 'vitest';
import {createRoot, createSignal} from 'solid-js';
import type {EditorState} from './model';
import {createAnimationStore} from './animation';
vi.mock('solid-js', () =>
  vi.importActual<typeof Solid>('solid-js/dist/solid.js'),
);

const tab = (id: string): EditorState => ({
  id,
  code: 'hello',
  languageId: 'typescript',
  lineNumberStart: 10,
  marks: {lines: [{line: 1, kind: 'highlight'}], focusedLines: [1]},
  tab: {tabName: `${id}.ts`},
});
test('explicit enrollment, stable ids, transitions, commits, duplication and removal', () =>
  createRoot(dispose => {
    const [tabs, setTabs] = createSignal([tab('a'), tab('b')]);
    const [active, setActive] = createSignal('a');
    const state = {
      get editors() {
        return tabs();
      },
      get activeEditorId() {
        return active();
      },
    };
    const animation = createAnimationStore({
      state,
      activeEditorView: () => undefined,
      activeEditorViewTabId: () => undefined,
      computed: {canAddEditor: () => state.editors.length < 6},
      actions: {
        setActiveEditorId: setActive,
        addEditor: value => {
          setTabs([...state.editors, {...tab('copy'), ...value, id: 'copy'}]);
        },
      },
    });
    const saves: unknown[] = [];
    animation.stateToPersist$.subscribe(value => saves.push(value));
    assert.equal(animation.stateToPersist(), undefined);
    animation.actions.setOpen(true);
    assert.deepEqual(
      animation.settings().steps.map(s => s.id),
      ['a', 'b'],
    );
    setTabs([...state.editors, tab('c')]);
    assert.equal(animation.settings().steps.length, 2);
    animation.actions.addStep('a');
    const id = animation.settings().steps[2].id;
    assert.notEqual(id, 'a');
    animation.actions.moveStep(id, -1);
    assert.equal(animation.settings().steps[1].id, id);
    const count = saves.length;
    animation.actions.setHoldMs(id, 1234, {commit: false});
    animation.actions.setTransition(
      id,
      {ms: 321, easing: 'strong'},
      {commit: false},
    );
    assert.equal(saves.length, count);
    animation.actions.setTransition(id, {ms: 321});
    assert.equal(saves.length, count + 1);
    animation.actions.applyToAll(id);
    assert.equal(animation.settings().transitionMs, 321);
    assert.equal(animation.settings().easing, 'strong');
    assert.ok(animation.settings().steps.every(s => !s.transition));
    animation.actions.setHeader({mode: 'title', title: ' hello '});
    assert.equal(animation.settings().header.title, 'hello');
    animation.actions.duplicateAsNext(id);
    assert.equal(
      animation.settings().steps[2].editorId,
      'copy',
      JSON.stringify({steps: animation.settings().steps, tabs: state.editors}),
    );
    assert.deepEqual(state.editors.at(-1)?.marks, state.editors[0].marks);
    assert.equal(animation.playback().state, 'editing');
    animation.actions.select({stepId: id, kind: 'hold'});
    animation.actions.removeStep(id);
    assert.equal(animation.selection(), null);
    animation.actions.setFromPersistedState(animation.stateToPersist());
    assert.equal(animation.settings().header.mode, 'title');
    while (animation.settings().steps.length > 1)
      animation.actions.removeStep(animation.settings().steps[0].id);
    animation.actions.removeStep(animation.settings().steps[0].id);
    assert.equal(animation.settings().steps.length, 1);
    dispose();
  }));
