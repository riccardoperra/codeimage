import {getRootEditorStore} from '@codeimage/store/editor';
import {Annotation, Transaction} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {createEffect, createSignal, lazy, on} from 'solid-js';

const syncAnnotation = Annotation.define<boolean>();

function syncDispatch(tr: Transaction, other: EditorView) {
  if (!tr.changes.empty && !tr.annotation(syncAnnotation)) {
    const annotations: Annotation<unknown>[] = [syncAnnotation.of(true)];
    const userEvent = tr.annotation(Transaction.userEvent);
    if (userEvent) annotations.push(Transaction.userEvent.of(userEvent));
    other.dispatch({changes: tr.changes, annotations});
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
        setTimeout(() => syncDispatch(tr, editorView), 250);
        setInterval(() => editorView.requestMeasure());
      });
    }),
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
