import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getUiStore} from '@codeimage/store/ui';
import {HStack, toast} from '@codeimage/ui';
import {EditorView} from '@codemirror/view';
import {Button} from '@codeui/kit';
import {
  createCompartmentExtension,
  createEditorControlledValue,
  createEditorFocus,
} from 'solid-codemirror';
import {Accessor, createEffect, createSignal, on} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {SparklesIcon} from '../Icons/SparklesIcon';
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

  createCompartmentExtension(() => {
    let activeToastId: string | null = null;
    return EditorView.domEventHandlers({
      paste(event, view) {
        if (activeToastId) toast.dismiss(activeToastId);
        setTimeout(() => {
          if (!activeEditorStore.canFormat()) {
            return;
          }
          activeToastId = toast.success(
            activeToast => {
              const [t] = useI18n<AppLocaleEntries>();
              return (
                <div>
                  <HStack
                    spacing={5}
                    display={'flex'}
                    justifyContent={'spaceBetween'}
                    alignItems={'center'}
                  >
                    <span>{t('canvas.pastedCode')}</span>
                    <Button
                      size={'xs'}
                      theme={'primary'}
                      leftIcon={<SparklesIcon size={'xs'} />}
                      disabled={!activeEditorStore.canFormat()}
                      onClick={() => {
                        const localValue = view.state.doc.toString();
                        activeEditorStore.format(localValue);
                        toast.dismiss(activeToast.id);
                      }}
                    >
                      Format
                    </Button>
                  </HStack>
                </div>
              );
            },
            {
              position: 'bottom-center',
              theme: getUiStore().invertedThemeMode(),
            },
          );
        }, 50);
      },
    });
  }, editorView);

  createEditorControlledValue(
    editorView as Accessor<EditorView>,
    () => activeEditorStore.editor()?.code ?? '',
  );

  return (
    <CustomEditor
      onEditorViewChange={setEditorView}
      onValueChange={activeEditorStore.setCode}
      readOnly={props.readOnly}
    />
  );
}
