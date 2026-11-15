import {getEditorStore} from '@codeimage/store/editor';

const SNIPPETS = [
  ['counter.ts', 'function counter() {\n  let count = 0;\n  return count;\n}'],
  [
    'counter.ts',
    'function counter(start = 0) {\n  let count = start;\n  const inc = () => count++;\n  return {inc};\n}',
  ],
  [
    'signal.ts',
    "import {createSignal} from 'solid-js';\n\nconst [count, setCount] = createSignal(0);\nsetCount(c => c + 1);",
  ],
  [
    'view.tsx',
    'export function View() {\n  const [count, setCount] = createSignal(0);\n  return <button onClick={() => setCount(c => c + 1)}>{count()}</button>;\n}',
  ],
] as const;

// Unequal on purpose: one 10 s hold, zero holds, 100 ms and 5 s transitions.
const HOLDS = [800, 3000, 200, 10000, 0, 1500, 400, 6000, 100, 2500];
const TRANSITIONS = [700, 300, 2000, 100, 5000, 600, 150, 1200, 400, 900];
const EASINGS = ['smooth', 'snappy', 'strong', 'linear', 'smooth'] as const;

export function seedSteps(count: number) {
  const {editor, animation} = getEditorStore();
  const {state, actions} = editor;
  SNIPPETS.forEach(([name, code], index) => {
    if (index === 0 && state.editors.length >= 1) {
      actions.setEditors(0, {code, tab: {tabName: name}});
      return;
    }
    if (state.editors.length <= index)
      actions.addEditor({code, tab: {tabName: name}, languageId: 'typescript'});
    else actions.setEditors(index, {code, tab: {tabName: name}});
  });
  const ids = state.editors.slice(0, SNIPPETS.length).map(tab => tab.id);
  const steps = Array.from({length: count}, (_, i) => ({
    id: `seed-${i}`,
    editorId: ids[i % ids.length],
    holdMs: HOLDS[i % HOLDS.length],
    ...(i > 0
      ? {
          transition: {
            ms: TRANSITIONS[i % TRANSITIONS.length],
            easing: EASINGS[i % EASINGS.length],
          },
        }
      : {}),
  }));
  animation.actions.setOpen(true);
  animation.actions.setFromPersistedState({
    steps,
    transitionMs: 700,
    easing: 'smooth',
    fps: 30,
    header: {mode: 'tab', title: ''},
  });
}
