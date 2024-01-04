import {getRootEditorStore} from '@codeimage/store/editor';
import {Transaction} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {createEventStack} from '@solid-primitives/event-bus';
import {createCompartmentExtension} from 'solid-codemirror';
import {createEffect, createSignal, lazy, on} from 'solid-js';
import {diffMarkerStateIconGutter} from './plugins/diff/extension';
import {syncDispatch} from './plugins/sync/sync';

const CustomEditor = lazy(() => import('./CustomEditor'));

interface PreviewExportEditorProps {
  onSetEditorView(editorView: EditorView | undefined): void;
}

export default function PreviewExportEditor(props: PreviewExportEditorProps) {
  const [editorView, setEditorView] = createSignal<EditorView>();
  const {canvasEditorEvents} = getRootEditorStore();
  const transactions = createEventStack<Transaction>();
  canvasEditorEvents.listen(tr => transactions.emit(tr));

  const sync = (tr: Transaction, editorView: EditorView) => {
    try {
      syncDispatch(tr, editorView);
      editorView.requestMeasure();
    } catch (e) {
      console.error(e);
    }
  };

  let unsubscribe: VoidFunction;
  createEffect(
    on(editorView, editorView => {
      if (unsubscribe) unsubscribe();
      if (!editorView) return;
      transactions.value().forEach(transaction => {
        sync(transaction, editorView);
        transactions.setValue(trs => trs.filter(tr => tr !== transaction));
      });
      unsubscribe = transactions.listen(({event: transaction, remove}) => {
        sync(transaction, editorView);
        remove();
      });
    }),
  );

  createCompartmentExtension(diffMarkerStateIconGutter, editorView);

  return (
    <CustomEditor
      dispatchTransaction={false}
      onEditorViewChange={editorView => {
        props.onSetEditorView(editorView);
        setEditorView(editorView);
      }}
      readOnly={true}
    />
  );
}
