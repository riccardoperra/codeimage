import {getRootEditorStore} from '@codeimage/store/editor';
import {Annotation, StateEffect, Transaction} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {createCompartmentExtension} from 'solid-codemirror';
import {createEffect, createSignal, lazy, on} from 'solid-js';
import {diffCheckboxEffect} from './plugins/diff/diffCheckboxMarker';
import {diffMarkerStateIconGutterExtension} from './plugins/diff/diffMarkerStateIcon';

const syncAnnotation = Annotation.define<boolean>();

function syncDispatch(tr: Transaction, other: EditorView) {
  if (tr.annotation(syncAnnotation)) {
    return;
  }
  const annotations: Annotation<unknown>[] = [syncAnnotation.of(true)];
  const effects: StateEffect<unknown>[] = [];
  let changed = false;
  if (!tr.changes.empty) {
    changed = true;
    const userEvent = tr.annotation(Transaction.userEvent);
    if (userEvent) annotations.push(Transaction.userEvent.of(userEvent));
  }
  const stateEffects = tr.effects
    .filter(effect => !!effect)
    // TODO: add configuration
    .filter(effect => effect.is(diffCheckboxEffect));
  if (stateEffects.length) {
    changed = true;
    effects.push(...stateEffects);
  }
  if (changed) {
    other.dispatch({
      changes: tr.changes,
      effects,
      annotations,
    });
  }
}

const CustomEditor = lazy(() => import('./CustomEditor'));

interface PreviewExportEditorProps {
  onSetEditorView(editorView: EditorView | undefined): void;
}

export default function PreviewExportEditor(props: PreviewExportEditorProps) {
  const [editorView, setEditorView] = createSignal<EditorView>();

  createEffect(
    on(editorView, editorView => {
      if (!editorView) return;
      getRootEditorStore().canvasEditorEvents.listen(tr => {
        setTimeout(() => syncDispatch(tr, editorView), 100);
        setTimeout(() => editorView.requestMeasure());
      });
    }),
  );

  createCompartmentExtension(
    () => diffMarkerStateIconGutterExtension,
    editorView,
  );

  return (
    <CustomEditor
      onEditorViewChange={editorView => {
        props.onSetEditorView(editorView);
        setEditorView(editorView);
      }}
      readOnly={true}
    />
  );
}
