import {getRootEditorStore} from '@codeimage/store/editor';
import {Annotation, Transaction} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {createEffect, createSignal, lazy, on} from 'solid-js';

const syncAnnotation = Annotation.define<boolean>();

function syncDispatch(tr: Transaction, other: EditorView) {
  if (!tr.changes.empty && !tr.annotation(syncAnnotation)) {
    const annotations: Annotation<any>[] = [syncAnnotation.of(true)];
    const userEvent = tr.annotation(Transaction.userEvent);
    if (userEvent) annotations.push(Transaction.userEvent.of(userEvent));
    other.dispatch({changes: tr.changes, annotations});
  }
}

const CustomEditor = lazy(() => import('./CustomEditor'));

export default function PreviewExportEditor() {
  const [editorView, setEditorView] = createSignal<EditorView>();

  createEffect(
    on(editorView, editorView => {
      if (!editorView) return;
      getRootEditorStore().canvasEditorEvents.listen(tr => {
        setTimeout(() => syncDispatch(tr, editorView), 250);
      });
    }),
  );

  return <CustomEditor onEditorViewChange={setEditorView} readOnly={true} />;
}
