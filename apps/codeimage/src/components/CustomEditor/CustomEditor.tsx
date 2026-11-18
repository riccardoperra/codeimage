import {createScriptAids} from './plugins/scriptLines/extension';
import {trackSelection} from './plugins/selection';
import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {EditorView, lineNumbers} from '@codemirror/view';
import {EDITOR_BASE_SETUP} from './editorSetup';
import {
  createCodeMirror,
  createEditorReadonly,
  ExternalChange,
} from 'solid-codemirror';
import type {VoidProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createSignal,
  getOwner,
  onSettled,
  Show,
  untrack,
} from 'solid-js';
import {baseEditorTheme, editorFontTheme} from './editorTheme';
import {createTabIcon} from '../../hooks/use-tab-icon';
import {updateEditorDocument} from './documentSync';
import {lineMarksExtension} from './plugins/lineMarks';
import {
  gutterMarkPointerDown,
  popupTooltips,
} from './plugins/lineMarks/controls';
import {
  attachLineMarkEntry,
  gutterMarkHover,
  gutterMarkLeave,
} from './plugins/lineMarks/gutter';
import {useEditorPopupHost} from './popupHost';
import {
  lineMarksField,
  readMarks,
  marksValue,
  replaceMarks,
} from './plugins/lineMarks/state';

const entryStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  'clip-path': 'inset(50%)',
  'white-space': 'nowrap',
} as const;

async function loadLanguage(
  language: (typeof SUPPORTED_LANGUAGES)[number] | undefined,
  icon: ReturnType<ReturnType<typeof createTabIcon>>,
) {
  const extra = icon?.extraLanguage;
  if (extra?.overrideParent) {
    try {
      return await extra.extension();
    } catch {
      return language?.plugin();
    }
  }
  return language?.plugin();
}

interface CustomEditorProps {
  readOnly: boolean;
  onEditorViewChange?: (view: EditorView | undefined) => void;
  onValueChange?: (value: string) => void;
}

export default function CustomEditor(props: VoidProps<CustomEditorProps>) {
  const {getThemeResource, themeArray: themes} = getThemeStore();
  const [t] = useI18n<AppLocaleEntries>();
  const owner = getOwner();
  const popupHost = useEditorPopupHost();
  const [entry, setEntry] = createSignal<HTMLElement>();
  const languages = SUPPORTED_LANGUAGES;
  const {
    activeEditorView,
    state: editorState,
    computed: {selectedFont},
    actions: {setActiveEditorView, setActiveEditorViewTabId},
  } = getRootEditorStore();
  const {editor} = getActiveEditorStore();
  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === editor()?.languageId),
  );

  const initial = untrack(editor);
  let activeId = initial?.id;
  const initialMarks = initial?.marks ?? {lines: [], focusedLines: []};
  const {
    editorView,
    ref: setRef,
    createExtension,
  } = createCodeMirror({
    value: initial?.code,
    extensions: [
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({'aria-label': 'codeimage-editor'}),
      baseEditorTheme,
      trackSelection,
      lineMarksField.init(state => marksValue(state.doc, initialMarks)),
    ],
    onTransactionDispatched: tr => {
      if (props.readOnly || tr.annotation(ExternalChange)) return;
      if (tr.docChanged || tr.effects.some(effect => effect.is(replaceMarks))) {
        const active = editor();
        if (active && tr.state.field(lineMarksField, false)) {
          const index = editorState.editors.findIndex(
            tab => tab.id === active.id,
          );
          if (index < 0) return;
          getRootEditorStore().actions.setEditors(
            index,
            'marks',
            readMarks(tr.state),
          );
        }
      }
    },
    onValueChange: value => {
      if (!props.readOnly) props.onValueChange?.(value);
    },
  });

  createEffect(
    () => [editorView(), props.onEditorViewChange] as const,
    ([view, onChange]) => {
      onChange?.(view);
    },
  );
  createEffect(
    () => [editorView(), entry(), props.readOnly] as const,
    ([view, element, readOnly]) => {
      if (view && element && !readOnly)
        return attachLineMarkEntry(view, element);
    },
  );
  const icon = createTabIcon(
    () => editor()?.tab.tabName ?? null,
    () => editor()?.languageId ?? '',
    true,
  );
  const language = createMemo(() => loadLanguage(selectedLanguage(), icon()));
  const themeConfiguration = createMemo(
    () =>
      getThemeResource(editorState.options.themeId)?.[0]() ?? themes()[0]?.(),
  );

  createEditorReadonly(editorView, () => props.readOnly);
  createExtension(() =>
    editorFontTheme(
      selectedFont().name,
      editorState.options.fontWeight,
      editorState.options.enableLigatures,
    ),
  );
  createExtension(() => language());

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
  createExtension(() => {
    const offset = editorState.options.showLineNumbers
      ? (lineNumberStart() ?? 1) - 1
      : 0;
    return lineMarksExtension(
      !props.readOnly,
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
  createExtension(() => (props.readOnly ? [] : popupTooltips(popupHost())));
  createExtension(
    createScriptAids(
      () => props.readOnly,
      () => editor()?.id,
    ),
  );

  const configureHistory = createExtension(() =>
    props.readOnly ? [] : EDITOR_BASE_SETUP,
  );
  let publishedId: string | undefined;
  let publishedView: EditorView | undefined;
  const clearActiveView = () => {
    if (publishedView && untrack(activeEditorView) === publishedView) {
      setActiveEditorView(undefined);
      setActiveEditorViewTabId(undefined);
    }
    publishedId = undefined;
    publishedView = undefined;
  };
  onSettled(() => clearActiveView);

  createEffect(
    () => {
      const tab = editor();
      const readMarks = () => ({
        lines:
          tab?.marks.lines.map(mark => ({line: mark.line, kind: mark.kind})) ??
          [],
        focusedLines: tab ? [...tab.marks.focusedLines] : [],
      });
      return {
        view: editorView(),
        id: tab?.id,
        code: tab?.code,
        readOnly: props.readOnly,
        marks: props.readOnly ? readMarks() : untrack(readMarks),
      };
    },
    input => {
      activeId = updateEditorDocument(input, activeId, configureHistory);
      if (!input.view || !activeId) {
        clearActiveView();
        return;
      }
      if (publishedId !== activeId || publishedView !== input.view) {
        publishedId = activeId;
        publishedView = input.view;
        setActiveEditorView(input.view);
        setActiveEditorViewTabId(activeId);
      }
    },
  );

  return (
    <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
      <Show when={!props.readOnly}>
        <span ref={setEntry} tabindex={0} style={entryStyle} />
      </Show>
      <div ref={setRef} />
    </code>
  );
}
