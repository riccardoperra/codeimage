import {
  createDerivedObservable,
  createDerivedSetter,
  createStore,
} from '@codeimage/atomic-state';
import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {createUniqueId} from '@codeimage/store/plugins/unique-id';
import {appEnvironment} from '@core/configuration';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {filter} from '@solid-primitives/immutable';
import {createMemo, createSelector} from 'solid-js';
import {WorkspaceItem} from '../../pages/Dashboard/dashboard.state';
import {EditorState, EditorUIOptions, PersistedEditorState} from './model';

const defaultId = createUniqueId();

export function getInitialEditorState(): EditorState {
  return {
    id: defaultId,
    code: appEnvironment.defaultState.editor.code,
    languageId: appEnvironment.defaultState.editor.languageId,
    tab: {
      tabName: 'index.tsx',
      tabIcon: undefined,
    },
  };
}

export function getInitialEditorUiOptions(): EditorUIOptions {
  return {
    themeId: 'vsCodeDarkTheme',
    showLineNumbers: false,
    fontId: appEnvironment.defaultState.editor.font.id,
    fontWeight: appEnvironment.defaultState.editor.font.types[0].weight,
    focused: false,
  };
}

export function createEditorsStore() {
  const MAX_TABS = 6;

  const [state, setState] = createStore({
    editors: [getInitialEditorState()],
    options: getInitialEditorUiOptions(),
    activeEditorId: defaultId,
  });

  const isActive = createSelector(() => state.activeEditorId);
  const setEditors = createDerivedSetter(state, ['editors']);

  const [stateToPersist$, stateToPersist] = createDerivedObservable(() => {
    return {
      editors: state.editors.map(editor => {
        return {
          languageId: editor.languageId,
          code: window.btoa(editor.code),
          tab: editor.tab,
          id: editor.id,
        };
      }),
      options: {
        themeId: state.options.themeId,
        showLineNumbers: state.options.showLineNumbers,
        fontId: state.options.fontId,
        fontWeight: state.options.fontWeight,
      },
    };
  });

  const addEditor = (
    editorState?: Partial<EditorState> | null,
    active?: boolean,
  ) => {
    if (state.editors.length === MAX_TABS) return;
    const id = createUniqueId();
    const editor: EditorState = {
      ...getInitialEditorState(),
      tab: {
        tabName: null,
      },
      ...(editorState ?? {}),
      id,
    };
    setEditors(editors => [...editors, editor]);
    if (active) setState('activeEditorId', id);
  };

  const canAddEditor = () => state.editors.length < MAX_TABS;

  const removeEditor = (id: string) => {
    if (state.editors.length === 1) {
      return;
    }
    const $isActive = isActive(id);
    const currentIndex = state.editors.findIndex(editor => editor.id === id);
    const newActiveEditor = state.editors[currentIndex - 1];
    const updatedEditors = state.editors.filter(editor => editor.id !== id);
    if ($isActive) {
      setState('activeEditorId', newActiveEditor?.id ?? updatedEditors[0]?.id);
    }
    setEditors(updatedEditors);
  };

  const setTabName = (id: string, name: string, updateLanguage: boolean) => {
    const index = state.editors.findIndex(tab => isActive(tab.id));
    setEditors(index, 'tab', 'tabName', name);
    if (updateLanguage) {
      const matches = SUPPORTED_LANGUAGES.filter(language => {
        return language.icons.some(({matcher}) => matcher.test(name));
      });
      if (
        !matches.length ||
        matches.map(match => match.id).includes(state.editors[index].languageId)
      ) {
        return;
      }
      setEditors(index, 'languageId', matches[0].id);
    }
  };

  const font = createMemo(
    () => filter(SUPPORTED_FONTS, font => font.id === state.options.fontId)[0],
  );

  const setFromWorkspace = (item: WorkspaceItem) => {
    setEditors(
      item.snippets.editors.map(editor => ({
        ...editor,
        code: window.atob(editor.code),
      })),
    );
    setState('activeEditorId', item.snippets.editors[0].id);
    setState('options', item.snippets.options);
  };

  return {
    state,
    isActive,
    stateToPersist,
    stateToPersist$,
    computed: {
      font,
      canAddEditor,
    },
    actions: {
      setEditors,
      addEditor,
      removeEditor,
      setTabName,
      setFromWorkspace,
      setFromPersistedState: (state: PersistedEditorState) => {
        const editors = (state.editors ?? [])
          .slice(0, MAX_TABS)
          .map(editor => ({
            ...editor,
            code: window.atob(editor.code),
          }));
        setState(state => ({
          options: {...state.options, ...state.options},
          activeEditorId: editors[0].id,
          editors: [...editors],
        }));
      },
      setActiveEditorId: (id: string) => {
        setState('activeEditorId', id);
      },
      setFocused: (focused: boolean) => {
        setState('options', 'focused', focused);
      },
      setFontId: (fontId: string) => {
        setState('options', 'fontId', fontId);
      },
      setThemeId: (themeId: string) => {
        setState('options', 'themeId', themeId);
      },
      setFontWeight: (fontWeight: number) => {
        setState('options', 'fontWeight', fontWeight);
      },
      setShowLineNumbers: (show: boolean) => {
        setState('options', 'showLineNumbers', show);
      },
    },
  } as const;
}
