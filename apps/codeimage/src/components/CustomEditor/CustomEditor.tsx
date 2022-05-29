import {
  EDITOR_BASE_SETUP,
  SUPPORTED_LANGUAGES,
  SUPPORTED_THEMES,
} from '@codeimage/config';
import {
  getActiveEditorState,
  getRootEditorsState,
} from '@codeimage/store/editor';
import {EditorView, lineNumbers} from '@codemirror/view';
import {debounceTime, ReplaySubject, takeUntil} from 'rxjs';
import {createCodeMirror} from 'solid-codemirror';
import {
  batch,
  createEffect,
  createMemo,
  createResource,
  onCleanup,
} from 'solid-js';
import {SUPPORTED_FONTS} from '../../core/configuration/font';
import {focusedEditor$} from '../../state/editor';
import {createCustomFontExtension} from './custom-font-extension';
import {observeFocusExtension} from './observe-focus-extension';

export const CustomEditor = () => {
  let editorEl!: HTMLDivElement;
  const destroy$ = new ReplaySubject<void>(1);
  const themes = SUPPORTED_THEMES;
  const languages = SUPPORTED_LANGUAGES;
  const fonts = SUPPORTED_FONTS;
  const {editor: editorState} = getRootEditorsState();
  const {editor, setCode, setFocused} = getActiveEditorState();

  const selectedLanguage = createMemo(() =>
    languages.find(language => language.id === editor()?.languageId),
  );

  const {view, setOptions, setContainer} = createCodeMirror({
    container: editorEl,
    onChange: setCode,
    extensions: [],
    editable: true,
  });

  const [currentLanguage] = createResource(selectedLanguage, ({plugin}) =>
    plugin(),
  );

  const themeConfiguration = createMemo(
    () => themes.find(theme => theme.id === editorState.themeId) ?? themes[0],
  );

  const currentTheme = () => themeConfiguration()?.editorTheme || [];

  const supportsLineWrap = EditorView.lineWrapping;

  const baseTheme = EditorView.theme({
    '&': {
      textAlign: 'left',
      background: 'transparent',
    },
    '.cm-content': {
      textAlign: 'left',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
    },
    '.cm-lineNumbers': {
      position: 'sticky',
      flexDirection: 'column',
      flexShrink: 0,
    },
    '.cm-lineNumbers .cm-gutterElement': {
      textAlign: 'right',
      padding: '0 16px 0 8px',
      lineHeight: '21px',
    },
    '.cm-line': {
      padding: '0 2px 0 8px',
    },
    '.cm-cursor': {
      borderLeftWidth: '2px',
      height: '21px',
      transform: 'translateY(-10%)',
    },
  });

  const customFontExtension = () =>
    createCustomFontExtension({
      fontName:
        fonts.find(({id}) => editorState.fontId === id)?.name || fonts[0].name,
      // TODO editor fix type never null
      fontWeight: editorState.fontWeight ?? 400,
    });

  setTimeout(() => {
    const content = document.querySelector('.cm-content');
    if (!content) {
      return;
    }

    /**
     * **🚀 Seo tip: fix invalid aria roles for CodeMirror**
     */
    content.setAttribute('id', 'codeEditor');
    content.setAttribute('aria-label', 'codeimage-editor');
    content.removeAttribute('aria-expanded');
  });

  createEffect(() => {
    batch(() => {
      setContainer(editorEl);
    });
  });

  createEffect(() => {
    setOptions(() => ({
      value: editor()?.code,
    }));
  });

  createEffect(() => {
    batch(() =>
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // TODO: to fix type deep instantion
      setOptions({
        extensions: [
          EDITOR_BASE_SETUP,
          baseTheme,
          supportsLineWrap,
          observeFocusExtension(
            focused => setFocused(focused),
            vu => {
              // ATTENTION: a lot of multiple calls to fix!!
              focusedEditor$
                .pipe(takeUntil(destroy$), debounceTime(0))
                .subscribe(focused => {
                  if (focused && !vu.view.hasFocus) {
                    vu.view.focus();
                  }
                });
            },
          ),
          customFontExtension(),
          currentLanguage() || [],
          currentTheme(),
          editorState.showLineNumbers ? lineNumbers() : [],
        ],
      }),
    );
  });

  onCleanup(() => {
    view()?.destroy();
    destroy$.next();
    destroy$.complete();
  });

  return (
    <code class={`language-${selectedLanguage()?.id ?? 'default'}`}>
      <div ref={ref => (editorEl = ref)} class={`solid-cm`} />
    </code>
  );
};
