import {isolateHistory, undo} from '@codemirror/commands';
import type {CommentTokens} from '@codemirror/commands';
import {EditorState} from '@codemirror/state';
import {parseUnifiedDiff} from '../../core/diff/parseUnifiedDiff';
import type {DiffFile} from '../../core/diff/parseUnifiedDiff';
import {diffImportEditors} from './plugins/lineMarks/diffImportEditors';
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
import {Button} from '@ui/legacy-controls';
import {createCompartmentExtension, createEditorFocus} from 'solid-codemirror';
import type {JSX} from '@solidjs/web';
import {createEffect, createSignal, onSettled, snapshot} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {MAX_EDITOR_TABS} from '@codeimage/store/editor/model';
import {FormatPasteToast} from './FormatPasteToast';
import {createWatermarkCodeSource} from '@core/watermark/codemirror';
import CustomEditor from './CustomEditor';
import {createSecretsExtension} from './plugins/secrets';

interface CanvasEditorProps {
  readOnly: boolean;
}

function ActionToast(props: {
  message: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <HStack spacing={5} alignItems="center">
      <span>{props.message}</span>
      <Button size="xs" theme="primary" onClick={() => props.onAction()}>
        {props.action}
      </Button>
    </HStack>
  );
}

export default function CanvasEditor(props: CanvasEditorProps) {
  const [t] = useI18n<AppLocaleEntries>();
  const [editorView, setEditorView] = createSignal<EditorView>();
  const activeEditorStore = getActiveEditorStore();
  createWatermarkCodeSource(editorView);
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
    () =>
      [editorView(), activeEditorStore.editor()?.id, props.readOnly] as const,
    ([view, , readOnly]) => {
      if (view && !readOnly) secrets.refresh(view);
    },
  );
  const {
    state: editorState,
    actions: {setFocused},
  } = getRootEditorStore();

  let pasteNotice: ReturnType<typeof setTimeout> | undefined;
  let activeToastId: string | null = null;
  onSettled(() => () => {
    clearTimeout(pasteNotice);
    if (activeToastId) toast.dismiss(activeToastId);
  });

  const {setFocused: editorSetFocused} = createEditorFocus(
    editorView,
    setFocused,
  );
  createEffect(
    () => [editorView(), editorState.options.focused] as const,
    ([view, focused]) => {
      if (view && !view.hasFocus && focused) editorSetFocused(true);
    },
  );

  createCompartmentExtension(
    [
      diffImportHistory,
      EditorView.updateListener.of(update => {
        for (const transaction of update.transactions)
          restoreDiffImport(transaction, snapshot => {
            const store = getRootEditorStore();
            store.actions.setActiveEditorId(snapshot.activeEditorId);
            store.actions.replaceEditors(structuredClone(snapshot.editors));
            if (transaction.isUserEvent('undo') && activeToastId)
              toast.dismiss(activeToastId);
          });
      }),
    ],
    editorView,
  );

  function showActionToast(render: (toastId: string) => JSX.Element) {
    activeToastId = toast.success(
      (activeToast: {id: string}) => render(activeToast.id),
      {
        position: 'bottom-center',
        duration: 10000,
        theme: getUiStore().invertedThemeMode(),
      },
    );
  }

  function importDiffFiles(
    view: EditorView,
    files: DiffFile[],
    tabId: string | undefined,
    toastId: string,
  ) {
    if (activeEditorStore.editor()?.id !== tabId || props.readOnly) {
      toast.dismiss(toastId);
      return;
    }
    const store = getRootEditorStore();
    if (files.length - 1 > MAX_EDITOR_TABS - store.state.editors.length) {
      toast.error(t('lineMarks.notEnoughTabs'));
      return;
    }
    const before = {
      activeEditorId: store.state.activeEditorId,
      editors: structuredClone(snapshot(store.state.editors)),
    };
    const after = diffImportEditors(
      before,
      files,
      tabId,
      activeEditorStore.editor()?.languageId ?? 'typescript',
    );
    const [first] = files;
    view.dispatch({
      changes: {from: 0, to: view.state.doc.length, insert: first.code},
      effects: [
        replaceMarks.of(
          marksValue(EditorState.create({doc: first.code}).doc, first.marks),
        ),
        importDiff.of({before, after}),
      ],
      userEvent: 'input.diff-import',
      annotations: isolateHistory.of('full'),
    });
    toast.dismiss(toastId);
    const imported = view.state;
    showActionToast(id => (
      <ActionToast
        message={t('lineMarks.importedDiff')}
        action={t('lineMarks.undo')}
        onAction={() => undoDiffImport(view, tabId, imported, id)}
      />
    ));
    view.focus();
  }

  function undoDiffImport(
    view: EditorView,
    tabId: string | undefined,
    imported: EditorState,
    toastId: string,
  ) {
    if (
      !props.readOnly &&
      activeEditorStore.editor()?.id === tabId &&
      view.state.doc.eq(imported.doc) &&
      view.state.field(lineMarksField) === imported.field(lineMarksField)
    )
      undo(view);
    toast.dismiss(toastId);
    view.focus();
  }

  function undoConvertedAnnotations(
    view: EditorView,
    tabId: string | undefined,
    converted: EditorState,
    toastId: string,
  ) {
    const marks = view.state.field(lineMarksField);
    const convertedMarks = converted.field(lineMarksField);
    if (
      activeEditorStore.editor()?.id === tabId &&
      view.state.doc.eq(converted.doc) &&
      marks.decorations === convertedMarks.decorations &&
      marks.focused === convertedMarks.focused
    )
      undo(view);
    toast.dismiss(toastId);
    view.focus();
  }

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
          showActionToast(id => (
            <ActionToast
              message={t(
                files.length === 1
                  ? 'lineMarks.diffFile'
                  : 'lineMarks.diffFiles',
                {count: String(files.length)},
              )}
              action={t('lineMarks.importDiff')}
              onAction={() => importDiffFiles(view, files, tabId, id)}
            />
          ));
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
          const converted = view.state;
          showActionToast(id => (
            <ActionToast
              message={t(
                count === 1
                  ? 'lineMarks.convertedOne'
                  : 'lineMarks.convertedMany',
                {count: String(count)},
              )}
              action={t('lineMarks.undo')}
              onAction={() =>
                undoConvertedAnnotations(view, tabId, converted, id)
              }
            />
          ));
          return true;
        }
        clearTimeout(pasteNotice);
        pasteNotice = setTimeout(() => {
          if (!activeEditorStore.canFormat()) {
            return;
          }
          activeToastId = toast.success(
            (activeToast: {id: string}) => (
              <FormatPasteToast
                onFormat={() => {
                  activeEditorStore.format(view.state.doc.toString());
                  toast.dismiss(activeToast.id);
                }}
              />
            ),
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
