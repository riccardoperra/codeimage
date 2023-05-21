import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {EditorView} from '@codemirror/view';
import {
  createCompartmentExtension,
  createEditorControlledValue,
  createEditorFocus,
} from 'solid-codemirror';
import {Accessor, createEffect, createSignal, on} from 'solid-js';
import CustomEditor from './CustomEditor';

interface CanvasEditorProps {
  readOnly: boolean;
}

export default function CanvasEditor(props: CanvasEditorProps) {
  const [editorView, setEditorView] = createSignal<EditorView>();
  const activeEditorStore = getActiveEditorStore();
  const {
    state: editorState,
    actions: {setFocused},
  } = getRootEditorStore();

  const {setFocused: editorSetFocused} = createEditorFocus(
    editorView as Accessor<EditorView>,
    focusing => setFocused(focusing),
  );

  createEffect(
    on(
      editorView,
      view => {
        if (!view) return;
        createEffect(
          on(
            () => editorState.options.focused,
            isFocused => {
              if (view && !view.hasFocus && isFocused) {
                editorSetFocused(true);
              }
            },
          ),
        );
      },
      {defer: true},
    ),
  );

  createCompartmentExtension(
    () =>
      EditorView.domEventHandlers({
        paste(event, view) {
          setTimeout(() => {
            const localValue = view.state.doc.toString();
            activeEditorStore.format(localValue);
          });
        },
      }),
    editorView,
  );

  createEditorControlledValue(
    editorView as Accessor<EditorView>,
    () => activeEditorStore.editor()?.code ?? '',
  );

  return (
    <CustomEditor
      onEditorViewChange={setEditorView}
      readOnly={props.readOnly}
    />
  );
}
