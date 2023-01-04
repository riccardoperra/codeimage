import type * as ApiTypes from '@codeimage/api/api-types';
import {createDerivedSetter, experimental} from '@codeimage/atomic-state';
import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {createUniqueId} from '@codeimage/store/plugins/unique-id';
import {appEnvironment} from '@core/configuration';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import {filter} from '@solid-primitives/immutable';
import {map, shareReplay} from 'rxjs';
import {createMemo, createSelector} from 'solid-js';
import {SetStoreFunction} from 'solid-js/store';
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

  const store = experimental
    .createExperimentalStore({
      editors: [getInitialEditorState()],
      options: getInitialEditorUiOptions(),
      activeEditorId: defaultId,
    })
    .extend(
      experimental.withProxyCommands<{
        setActiveEditorId: string;
        setFocused: boolean;
        setFontId: string;
        setThemeId: string;
        setFontWeight: number;
        setShowLineNumbers: boolean;
        setFromPersistedState: PersistedEditorState;
      }>(),
    );

  const editorUpdateCommand = experimental
    .createCommand('editorUpdate')
    .withPayload<void>();

  store
    .hold(store.commands.setActiveEditorId, (activeEditorId, {set}) =>
      set('activeEditorId', activeEditorId),
    )
    .hold(store.commands.setFocused, (focused, {set}) =>
      set('options', 'focused', focused),
    )
    .hold(store.commands.setFocused, (focused, {set}) =>
      set('options', 'focused', focused),
    )
    .hold(store.commands.setFontId, (fontId, {set}) =>
      set('options', 'fontId', fontId),
    )
    .hold(store.commands.setThemeId, (themeId, {set}) =>
      set('options', 'themeId', themeId),
    )
    .hold(store.commands.setFontWeight, (fontWeight, {set}) =>
      set('options', 'fontWeight', fontWeight),
    )
    .hold(store.commands.setShowLineNumbers, (showLineNumbers, {set}) =>
      set('options', 'showLineNumbers', showLineNumbers),
    )
    .hold(store.commands.setFromPersistedState, (persistedState, {state}) => {
      const editors = (persistedState.editors ?? [])
        .slice(0, MAX_TABS)
        .map(editor => ({
          tabName: editor.tabName,
          languageId: editor.languageId,
          id: editor.id,
          code: editor.code,
        }));
      return {
        options: {...persistedState.options, ...state.options},
        activeEditorId: editors[0].id,
        editors: editors.map(editor => {
          return {
            code: editor.code,
            languageId: editor.languageId,
            tab: {tabName: editor.tabName},
            id: editor.id,
          };
        }),
      };
    });

  const isActive = createSelector(() => store.state.activeEditorId);
  const setEditors = createDerivedSetter(store.state, ['editors']);

  const mapToStateToPersistState = (
    state: typeof store.state,
  ): PersistedEditorState => {
    return {
      editors: state.editors.map(editor => {
        return {
          languageId: editor.languageId,
          code: editor.code,
          tabName: editor.tab.tabName ?? '',
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
  };

  const stateToPersist$ = store
    .watchCommand([
      store.commands.setFontId,
      store.commands.setThemeId,
      store.commands.setFontWeight,
      store.commands.setShowLineNumbers,
      editorUpdateCommand,
    ])
    .pipe(
      map(() => store.get()),
      map(mapToStateToPersistState),
      shareReplay({refCount: true, bufferSize: 1}),
    );

  const addEditor = (
    editorState?: Partial<EditorState> | null,
    active?: boolean,
  ) => {
    if (store.state.editors.length === MAX_TABS) return;
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
    if (active) store.set('activeEditorId', id);
    store.dispatch(editorUpdateCommand, void 0);
  };

  const canAddEditor = () => store.state.editors.length < MAX_TABS;

  const removeEditor = (id: string) => {
    if (store.state.editors.length === 1) {
      return;
    }
    const $isActive = isActive(id);
    const currentIndex = store.state.editors.findIndex(
      editor => editor.id === id,
    );
    const newActiveEditor = store.state.editors[currentIndex - 1];
    const updatedEditors = store.state.editors.filter(
      editor => editor.id !== id,
    );
    if ($isActive) {
      store.set('activeEditorId', newActiveEditor?.id ?? updatedEditors[0]?.id);
    }
    setEditors(updatedEditors);
    store.dispatch(editorUpdateCommand, void 0);
  };

  const setTabName = (id: string, name: string, updateLanguage: boolean) => {
    const index = store.state.editors.findIndex(tab => isActive(tab.id));
    setEditors(index, 'tab', 'tabName', name);
    if (updateLanguage) {
      const matches = SUPPORTED_LANGUAGES.filter(language => {
        return language.icons.some(({matcher}) => matcher.test(name));
      });
      if (
        !matches.length ||
        matches
          .map(match => match.id)
          .includes(store.state.editors[index].languageId)
      ) {
        return;
      }
      setEditors(index, 'languageId', matches[0].id);
    }
    store.dispatch(editorUpdateCommand, void 0);
  };

  const font = createMemo(
    () =>
      filter(
        SUPPORTED_FONTS,
        font => font.id === store.state.options.fontId,
      )[0],
  );

  const setFromWorkspace = (item: ApiTypes.GetProjectByIdApi['response']) => {
    setEditors(
      item.editorTabs.map(
        editor =>
          ({
            tab: {
              tabName: editor.tabName,
            },
            languageId: editor.languageId,
            id: editor.id,
            code: editor.code,
          } as EditorState),
      ),
    );
    store.set('activeEditorId', item.editorTabs[0].id);
    store.set('options', item.editorOptions);
    store.dispatch(editorUpdateCommand, void 0);
  };

  const setEditorsWithCommand: SetStoreFunction<EditorState[]> = (
    ...args: unknown[]
  ) => {
    (setEditors as any)(...args);
    store.dispatch(editorUpdateCommand, void 0);
  };

  return {
    get state() {
      return store.state;
    },
    setState: store.set,
    isActive,
    stateToPersist() {
      const state = store.get();
      return mapToStateToPersistState(state);
    },
    stateToPersist$,
    computed: {
      font,
      canAddEditor,
    },
    actions: {
      setEditors: setEditorsWithCommand,
      addEditor,
      removeEditor,
      setTabName,
      setFromWorkspace,
      ...store.actions,
    },
  } as const;
}
