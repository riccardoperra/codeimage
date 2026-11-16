import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  isolateHistory,
} from '@codemirror/commands';
import {bracketMatching, indentOnInput} from '@codemirror/language';
import type {Extension} from '@codemirror/state';
import {EditorState, Transaction} from '@codemirror/state';
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
} from '@codemirror/view';
import {createCodeMirror, createEditorReadonly} from 'solid-codemirror';
import type {VoidProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createResource,
  getOwner,
  on,
  untrack,
} from 'solid-js';
import {baseEditorTheme} from './editorTheme';
import {createTabIcon} from '../../hooks/use-tab-icon';
import {mapLines} from '../../core/diff/mapLines';
import {lineMarksExtension} from './plugins/lineMarks';
import {gutterMarkPointerDown} from './plugins/lineMarks/controls';
import {gutterMarkHover, gutterMarkLeave} from './plugins/lineMarks/gutter';
import {
  lineMarksField,
  readMarks,
  marksValue,
  replaceMarks,
} from './plugins/lineMarks/state';

const EDITOR_BASE_SETUP: Extension = [
  highlightSpecialChars(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  history(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...completionKeymap,
    ...historyKeymap,
    indentWithTab,
  ]),
];

interface CustomEditorProps {
  readOnly: boolean;
  onEditorViewChange?: (view: EditorView | undefined) => void;
  onValueChange?: (value: string) => void;
}

export default function CustomEditor(props: VoidProps<CustomEditorProps>) {
  const {themeArray: themes} = getThemeStore();
  const [t] = useI18n<AppLocaleEntries>();
  const owner = getOwner();
  const languages = SUPPORTED_LANGUAGES;
  const {
    state: editorState,
    computed: {selectedFont},
    actions: {setActiveEditorViewTabId},
  } = getRootEditorStore();
  const {editor} = getActiveEditorStore();
  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === editor()?.languageId),
  );

  let syncing = false;
  let activeId = untrack(() => editor()?.id);
  const {
    editorView,
    ref: setRef,
    createExtension,
  } = createCodeMirror({
    value: editor()?.code,
    onTransactionDispatched: tr => {
      if (props.readOnly || syncing) return;
      if (tr.docChanged || tr.effects.some(effect => effect.is(replaceMarks))) {
        const active = editor();
        if (active && tr.state.field(lineMarksField, false)) {
          const index = editorState.editors.findIndex(
            tab => tab.id === active.id,
          );
          getRootEditorStore().actions.setEditors(
            index,
            'marks',
            readMarks(tr.state),
          );
        }
      }
    },
    onValueChange: value => {
      if (!syncing) props.onValueChange?.(value);
    },
  });

  createEffect(() => props.onEditorViewChange?.(editorView()));

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const icon = createTabIcon(
    () => editor()?.tab.tabName ?? null,
    () => editor()?.languageId ?? '',
    true,
  );

  const [currentExtraLanguage] = createResource(icon, iconDef => {
    return iconDef?.extraLanguage
      ?.extension()
      .then(extension => {
        return {
          extension,
          overrideParent: iconDef.extraLanguage?.overrideParent,
        };
      })
      .catch(() => null);
  });

  const themeConfiguration = createMemo(
    () =>
      themes().find(theme => theme()?.id === editorState.options.themeId)?.() ??
      themes()[0](),
  );

  const customFontExtension = (): Extension => {
    const font = selectedFont();
    const fontName = font.name,
      fontWeight = editorState.options.fontWeight,
      enableLigatures = editorState.options.enableLigatures;

    const fontVariantLigatures = !!enableLigatures ? 'normal' : 'none';

    return EditorView.theme({
      '.cm-content *': {
        fontFamily: `${fontName}, monospace`,
        fontWeight: fontWeight,
        fontVariantLigatures,
      },
      '.cm-gutters': {
        fontFamily: `${fontName}, monospace`,
        fontWeight: 400,
        fontVariantLigatures,
      },
    });
  };

  createEditorReadonly(editorView, () => props.readOnly);
  // Code that is not editable is not focusable either, and leaving the
  // animation preview returns the focus to it.
  createExtension(() =>
    props.readOnly ? EditorView.contentAttributes.of({tabindex: '0'}) : [],
  );
  createExtension(EditorView.lineWrapping);
  createExtension(() =>
    EditorView.contentAttributes.of({
      'aria-label': 'codeimage-editor',
    }),
  );
  createExtension(() => customFontExtension());
  createExtension(() => {
    const language = currentLanguage();
    const extraLanguage = currentExtraLanguage();
    if (!extraLanguage && !language) {
      return [];
    }
    if (!extraLanguage) {
      return language ?? [];
    }
    if (extraLanguage.overrideParent) {
      return extraLanguage.extension ?? [];
    }
  });

  const lineNumberStart = createMemo(() => editor()?.lineNumberStart);
  createExtension(() => {
    const lnStart = lineNumberStart() ?? 1;
    const newLn = (ln: number) => ln + (lnStart - 1);
    return editorState.options.showLineNumbers
      ? [
          lineNumbers({
            formatNumber: lineNo => String(newLn(lineNo)),
            domEventHandlers: {
              pointerdown: gutterMarkPointerDown,
              pointermove: gutterMarkHover,
              pointerout: gutterMarkLeave,
            },
          }),
          EditorView.editorAttributes.of({'data-line-numbers': 'true'}),
        ]
      : [];
  });
  createExtension(() => themeConfiguration()?.editorTheme || []);
  createExtension(baseEditorTheme);
  const initialMarks = untrack(
    () => editor()?.marks ?? {lines: [], focusedLines: []},
  );
  createExtension(() => {
    // Names use the numbers the user sees, so a custom start shifts them too.
    const offset = editorState.options.showLineNumbers
      ? (lineNumberStart() ?? 1) - 1
      : 0;
    return lineMarksExtension(
      !props.readOnly,
      initialMarks,
      {
        toolbar: t('lineMarks.toolbar'),
        highlight: t('lineMarks.highlight'),
        added: t('lineMarks.added'),
        removed: t('lineMarks.removed'),
        clear: t('lineMarks.clear'),
        focus: t('lineMarks.focus'),
        focusHint: t('lineMarks.focusHint'),
        removeMark: t('lineMarks.removeMark'),
        unmarked: t('lineMarks.unmarked'),
        line: line => t('lineMarks.line', {line: String(line + offset)}),
        selection: (from, to) =>
          t('lineMarks.selection', {
            from: String(from + offset),
            to: String(to + offset),
          }),
      },
      owner ?? undefined,
    );
  });
  createExtension(() => EditorState.readOnly.of(props.readOnly));

  const reconfigureBaseSetup = createExtension(EDITOR_BASE_SETUP);

  createEffect(
    on(
      () => props.readOnly,
      readOnly => {
        const extension = readOnly ? [] : EDITOR_BASE_SETUP;
        reconfigureBaseSetup(extension);
      },
    ),
  );

  createEffect(
    on(
      () => {
        const tab = editor();
        return {
          view: editorView(),
          id: tab?.id,
          code: tab?.code,
          marks:
            props.readOnly && tab
              ? {
                  lines: tab.marks.lines.map(mark => ({
                    line: mark.line,
                    kind: mark.kind,
                  })),
                  focusedLines: [...tab.marks.focusedLines],
                }
              : null,
        };
      },
      ({view, id, code, marks}) => {
        if (
          !view ||
          !id ||
          code === undefined ||
          !view.state.field(lineMarksField, false)
        )
          return;
        const changedTab = id !== activeId;
        const current = view.state.doc.toString();
        const changedCode = code !== current;
        if (!changedTab && !changedCode && !marks) {
          setActiveEditorViewTabId(id);
          return;
        }
        if (!changedTab && changedCode && !props.readOnly) {
          // Format rewrites the stored code; map marks by line and keep the step undoable.
          const lines = mapLines(current, code);
          const previous = readMarks(view.state);
          view.dispatch({
            changes: {from: 0, to: view.state.doc.length, insert: code},
            effects: replaceMarks.of(
              marksValue(EditorState.create({doc: code}).doc, {
                focusedLines: previous.focusedLines.flatMap(
                  line => lines.get(line) ?? [],
                ),
                lines: previous.lines.flatMap(mark => {
                  const line = lines.get(mark.line);
                  return line ? [{...mark, line}] : [];
                }),
              }),
            ),
            annotations: isolateHistory.of('full'),
          });
          return;
        }
        const tabMarks = marks ??
          editor()?.marks ?? {lines: [], focusedLines: []};
        const doc = changedCode
          ? EditorState.create({doc: code}).doc
          : view.state.doc;
        syncing = true;
        try {
          if (changedTab && !props.readOnly) reconfigureBaseSetup([]);
          view.dispatch({
            changes: changedCode
              ? {from: 0, to: view.state.doc.length, insert: code}
              : undefined,
            effects: replaceMarks.of(marksValue(doc, tabMarks)),
            selection: changedTab ? {anchor: 0} : undefined,
            annotations: Transaction.addToHistory.of(false),
          });
          if (changedTab && !props.readOnly)
            reconfigureBaseSetup(EDITOR_BASE_SETUP);
          activeId = id;
          view.requestMeasure();
        } finally {
          syncing = false;
        }
        setActiveEditorViewTabId(id);
      },
    ),
  );

  return (
    <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
      <div ref={setRef} />
    </code>
  );
}
