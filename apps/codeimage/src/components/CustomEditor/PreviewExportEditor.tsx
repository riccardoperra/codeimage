import {getRootEditorStore} from '@codeimage/store/editor';
import {EditorView} from '@codemirror/view';
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

  createEffect(
    on(editorView, editorView => {
      if (!editorView) return;
      getRootEditorStore().canvasEditorEvents.listen(tr => {
        setTimeout(() => {
          syncDispatch(tr, editorView);
          editorView.requestMeasure();
        }, 100);
      });
    }),
  );

  createCompartmentExtension(diffMarkerStateIconGutter, editorView);

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
