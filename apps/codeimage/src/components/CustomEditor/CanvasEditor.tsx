import {inferLanguageFromPath} from '@codeimage/config';
import {isolateHistory, undo} from '@codemirror/commands';
import type {CommentTokens} from '@codemirror/commands';
import {EditorState} from '@codemirror/state';
import {parseUnifiedDiff} from '../../core/diff/parseUnifiedDiff';
import {getInitialEditorState} from '../../state/editor/editor';
import {createUniqueId} from '../../state/plugins/unique-id';
import {
  diffImportHistory,
  importDiff,
  restoreDiffImport,
} from './plugins/lineMarks/diffImportHistory';
import {pasteAnnotations} from './plugins/lineMarks/paste';
import {
  lineMarksField,
  marksValue,
  replaceMarks,
} from './plugins/lineMarks/state';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getUiStore} from '@codeimage/store/ui';
import {HStack, toast} from '@codeimage/ui';
import {EditorView} from '@codemirror/view';
import {Button} from '@codeui/kit';
import {createCompartmentExtension, createEditorFocus} from 'solid-codemirror';
import type {Accessor} from 'solid-js';
import {batch, createEffect, createSignal, on, onCleanup} from 'solid-js';
import {unwrap} from 'solid-js/store';
import type {AppLocaleEntries} from '../../i18n';
import {MAX_EDITOR_TABS} from '../../state/editor/model';
import {SparklesIcon} from '../Icons/SparklesIcon';
import CustomEditor from './CustomEditor';
import {createSecretsExtension} from './plugins/secrets';

interface CanvasEditorProps {
  readOnly: boolean;
}

export default function CanvasEditor(props: CanvasEditorProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const [editorView, setEditorView] = createSignal<EditorView>();
  const activeEditorStore = getActiveEditorStore();
  const secrets = createSecretsExtension(
    () => ({
      warning: ruleId =>
        t('secrets.warning', {kind: t(`secrets.rules.${ruleId}`)}),
      redact: t('secrets.redact'),
      ignore: t('secrets.ignore'),
    }),
    () => activeEditorStore.editor()?.id ?? '',
  );
  createCompartmentExtension(
    () => (props.readOnly ? [] : secrets.extension),
    editorView,
  );
  createEffect(
    on([editorView, () => activeEditorStore.editor()?.id], ([view]) => {
      if (view && !props.readOnly) secrets.refresh(view);
    }),
  );
  const {
    state: editorState,
    actions: {setFocused, setActiveEditorView},
  } = getRootEditorStore();
  createEffect(() => setActiveEditorView(editorView()));
  onCleanup(() => setActiveEditorView(undefined));

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

  let activeToastId: string | null = null;
  createCompartmentExtension(
    [
      diffImportHistory,
      EditorView.updateListener.of(update => {
        for (const transaction of update.transactions)
          restoreDiffImport(transaction, snapshot => {
            batch(() => {
              const store = getRootEditorStore();
              store.actions.setActiveEditorId(snapshot.activeEditorId);
              store.actions.setEditors(structuredClone(snapshot.editors));
            });
            if (transaction.isUserEvent('undo') && activeToastId)
              toast.dismiss(activeToastId);
          });
      }),
    ],
    editorView,
  );

  createCompartmentExtension(() => {
    return EditorView.domEventHandlers({
      paste(event, view) {
        if (props.readOnly) return false;
        if (activeToastId) toast.dismiss(activeToastId);
        const text = event.clipboardData?.getData('text/plain');
        if (!text) return false;
        const files = parseUnifiedDiff(text);
        if (files.length) {
          const tabId = activeEditorStore.editor()?.id;
          activeToastId = toast.success(
            activeToast => (
              <HStack spacing={5} alignItems="center">
                <span>
                  {t(
                    files.length === 1
                      ? 'lineMarks.diffFile'
                      : 'lineMarks.diffFiles',
                    {count: String(files.length)},
                  )}
                </span>
                <Button
                  size="xs"
                  theme="primary"
                  onClick={() => {
                    const store = getRootEditorStore();
                    if (
                      activeEditorStore.editor()?.id !== tabId ||
                      props.readOnly
                    ) {
                      toast.dismiss(activeToast.id);
                      return;
                    }
                    const newTabCount = files.length - 1;
                    if (
                      newTabCount >
                      MAX_EDITOR_TABS - store.state.editors.length
                    ) {
                      toast.error(t('lineMarks.notEnoughTabs'));
                      return;
                    }
                    const first = files[0];
                    const before = {
                      activeEditorId: store.state.activeEditorId,
                      editors: structuredClone(unwrap(store.state.editors)),
                    };
                    const languageId = (path: string) =>
                      inferLanguageFromPath(path) ??
                      activeEditorStore.editor()?.languageId ??
                      'typescript';
                    const after = {
                      activeEditorId: before.activeEditorId,
                      editors: [
                        ...before.editors.map(editor =>
                          editor.id === tabId
                            ? {
                                ...editor,
                                code: first.code,
                                marks: first.marks,
                                tab: {tabName: first.path},
                                languageId: languageId(first.path),
                              }
                            : editor,
                        ),
                        ...files.slice(1).map(file => ({
                          ...getInitialEditorState(),
                          id: createUniqueId(),
                          code: file.code,
                          marks: file.marks,
                          tab: {tabName: file.path},
                          languageId: languageId(file.path),
                        })),
                      ],
                    };
                    view.dispatch({
                      changes: {
                        from: 0,
                        to: view.state.doc.length,
                        insert: first.code,
                      },
                      effects: [
                        replaceMarks.of(
                          marksValue(
                            EditorState.create({doc: first.code}).doc,
                            first.marks,
                          ),
                        ),
                        importDiff.of({before, after}),
                      ],
                      annotations: isolateHistory.of('full'),
                    });
                    toast.dismiss(activeToast.id);
                    const importedState = view.state;
                    activeToastId = toast.success(
                      undoToast => (
                        <HStack spacing={5} alignItems="center">
                          <span>{t('lineMarks.importedDiff')}</span>
                          <Button
                            size="xs"
                            theme="primary"
                            onClick={() => {
                              if (
                                !props.readOnly &&
                                activeEditorStore.editor()?.id === tabId &&
                                view.state.doc.eq(importedState.doc) &&
                                view.state.field(lineMarksField) ===
                                  importedState.field(lineMarksField)
                              )
                                undo(view);
                              toast.dismiss(undoToast.id);
                              view.focus();
                            }}
                          >
                            {t('lineMarks.undo')}
                          </Button>
                        </HStack>
                      ),
                      {
                        position: 'bottom-center',
                        duration: 10000,
                        theme: getUiStore().invertedThemeMode(),
                      },
                    );
                    view.focus();
                  }}
                >
                  {t('lineMarks.importDiff')}
                </Button>
              </HStack>
            ),
            {
              position: 'bottom-center',
              duration: 10000,
              theme: getUiStore().invertedThemeMode(),
            },
          );
          return false;
        }
        const tokens =
          view.state.languageDataAt<CommentTokens>(
            'commentTokens',
            view.state.selection.main.from,
          )[0] ?? {};
        const count = pasteAnnotations(view, text, tokens);
        if (count) {
          event.preventDefault();
          const tabId = activeEditorStore.editor()?.id;
          const convertedState = view.state;
          activeToastId = toast.success(
            activeToast => (
              <HStack spacing={5} alignItems="center">
                <span>
                  {t(
                    count === 1
                      ? 'lineMarks.convertedOne'
                      : 'lineMarks.convertedMany',
                    {count: String(count)},
                  )}
                </span>
                <Button
                  size="xs"
                  theme="primary"
                  onClick={() => {
                    if (
                      activeEditorStore.editor()?.id === tabId &&
                      view.state.doc.eq(convertedState.doc) &&
                      view.state.field(lineMarksField).decorations ===
                        convertedState.field(lineMarksField).decorations &&
                      view.state.field(lineMarksField).focused ===
                        convertedState.field(lineMarksField).focused
                    )
                      undo(view);
                    toast.dismiss(activeToast.id);
                    view.focus();
                  }}
                >
                  {t('lineMarks.undo')}
                </Button>
              </HStack>
            ),
            {
              position: 'bottom-center',
              duration: 10000,
              theme: getUiStore().invertedThemeMode(),
            },
          );
          return true;
        }
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

  return (
    <CustomEditor
      onEditorViewChange={setEditorView}
      onValueChange={activeEditorStore.setCode}
      readOnly={props.readOnly}
    />
  );
}
