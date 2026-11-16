import {removeScriptStep} from '@core/animation/script';
import {selectedLines as selectedLineNumbers} from '../CustomEditor/plugins/lineMarks/controls';
import {getEditorStore} from '@codeimage/store/editor';
import type {
  ScriptLine,
  TabMarks,
  TabScript,
} from '@codeimage/store/editor/model';
import {createRandomId} from '@codeimage/store/plugins/unique-id';
import {setLineMarks} from '../CustomEditor/plugins/lineMarks/state';
import {batch} from 'solid-js';

type Store = ReturnType<typeof getEditorStore>;
export type LineAction = 'enter' | 'leave' | 'focus';

function saveMarks(store: Store, editorId: string, marks: TabMarks) {
  const index = store.editor.state.editors.findIndex(
    tab => tab.id === editorId,
  );
  if (index < 0) return;
  const view = store.editor.activeEditorView();
  if (view && store.editor.activeEditorViewTabId() === editorId)
    batch(() => setLineMarks(view, marks));
  else store.editor.actions.setEditors(index, 'marks', marks);
}

function selectStep(store: Store, id: string) {
  store.animation.actions.select({stepId: id, kind: 'hold'});
  store.animation.actions.editStep(
    store.animation.settings().steps.findIndex(step => step.id === id),
  );
}

export function addScriptStep(store: Store, editorId: string) {
  const tab = store.editor.state.editors.find(tab => tab.id === editorId);
  if (!tab) return;
  const id = createRandomId();
  const script: TabScript = tab.marks.script ?? {
    steps: store.animation
      .settings()
      .steps.filter(step => step.editorId === editorId)
      .map(step => step.id),
    lines: tab.marks.lines.flatMap((mark): ScriptLine[] =>
      mark.kind === 'added'
        ? [{line: mark.line, enter: 2}]
        : mark.kind === 'removed'
          ? [{line: mark.line, leave: 2}]
          : [],
    ),
  };
  batch(() => {
    saveMarks(store, editorId, {
      ...tab.marks,
      lines: tab.marks.lines.filter(mark => mark.kind === 'highlight'),
      script: {...script, steps: [...script.steps, id]},
    });
    selectStep(store, id);
  });
}

export function deleteScriptStep(store: Store, editorId: string, step: number) {
  const tab = store.editor.state.editors.find(tab => tab.id === editorId);
  const script = tab?.marks.script;
  if (!tab || !script) return;
  const selected = store.animation.selection();
  const next = removeScriptStep(script, step);
  const selectedId = !next
    ? !selected || script.steps.includes(selected.stepId)
      ? editorId
      : selected.stepId
    : selected && selected.stepId !== script.steps[step - 1]
      ? selected.stepId
      : next.steps[Math.max(0, step - 2)];
  batch(() => {
    const {script: _, ...marks} = tab.marks;
    saveMarks(store, editorId, {...marks, ...(next ? {script: next} : {})});
    selectStep(store, selectedId);
  });
}

export function selectedLines(store: Store, editorId: string): number[] {
  const view = store.editor.activeEditorView();
  if (!view || store.editor.activeEditorViewTabId() !== editorId) return [];
  return selectedLineNumbers(view.state);
}

export function lineActionState(
  editorId: string,
  lines: number[],
  action: LineAction,
  step: number,
) {
  const script = getEditorStore().editor.state.editors.find(
    tab => tab.id === editorId,
  )?.marks.script;
  return (
    !!script &&
    lines.length > 0 &&
    lines.every(number => {
      const line = script.lines.find(line => line.line === number);
      return action === 'focus'
        ? !!line?.focus?.includes(step)
        : line?.[action] === step;
    })
  );
}

export function applyLineAction(
  store: Store,
  editorId: string,
  action: LineAction,
  step: number,
) {
  const tab = store.editor.state.editors.find(tab => tab.id === editorId);
  const script = tab?.marks.script;
  const lines = selectedLines(store, editorId);
  if (!tab || !script || !lines.length || (action === 'leave' && step === 1))
    return;
  const clear = lineActionState(editorId, lines, action, step);
  const rules = new Map(script.lines.map(line => [line.line, line]));
  for (const number of lines) {
    const line: ScriptLine = {...rules.get(number), line: number};
    if (action === 'focus') {
      const focus = line.focus?.filter(value => value !== step) ?? [];
      line.focus = clear ? focus : [...focus, step].sort((a, b) => a - b);
    } else if (clear) delete line[action];
    else {
      line[action] = step;
      if (action === 'enter' && line.leave !== undefined && line.leave <= step)
        delete line.leave;
      if (action === 'leave' && (line.enter ?? 1) >= step) delete line.enter;
    }
    rules.set(number, line);
  }
  saveMarks(store, editorId, {
    ...tab.marks,
    script: {...script, lines: [...rules.values()]},
  });
  store.editor.activeEditorView()?.focus();
}
