import {
  defaultId,
  getInitialEditorState,
  getInitialEditorUiOptions,
} from './initialState';
export {getInitialEditorState, getInitialEditorUiOptions} from './initialState';
import type * as ApiTypes from '@codeimage/api/api-types';
import type {SetStoreFunction} from '@codeimage/atomic-state';
import {createPathSetter} from '@codeimage/atomic-state';
import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {provideAppState} from '@codeimage/store/index';
import {
  createEditorId,
  createRandomId,
} from '@codeimage/store/plugins/unique-id';
import type {PresetData} from '@codeimage/store/presets/types';
import type {EditorView} from '@codemirror/view';
import {from, map, shareReplay} from 'rxjs';
import {createSignal} from 'solid-js';
import {defineStore, useStore} from 'statebuilder';
import {createCommand, withProxyCommands} from 'statebuilder/commands';
import type {EditorState, PersistedEditorState} from './model';
import {MAX_EDITOR_TABS} from './model';

export function createEditorsStore() {
  const [activeEditorView, setActiveEditorView] = createSignal<EditorView>();
  const [activeEditorViewTabId, setActiveEditorViewTabId] =
    createSignal<string>();

  const config = defineStore(() => ({
    editors: [getInitialEditorState()],
    options: getInitialEditorUiOptions(),
    activeEditorId: defaultId,
  })).extend(
    withProxyCommands<{
      setActiveEditorId: string;
      setFocused: boolean;
      setFontId: string;
      setThemeId: string;
      setFontWeight: number;
      setShowLineNumbers: boolean;
      setFromPersistedState: PersistedEditorState;
      setFromPreset: PresetData['editor'];
      setEnableLigatures: boolean;
    }>(),
  );

  const store = provideAppState(config);
  const setState = createPathSetter(store.set);

  const configStore = useStore(EditorConfigStore);

  const editorUpdateCommand = createCommand('editorUpdate').withPayload<void>();

  store
    .hold(store.commands.setActiveEditorId, activeEditorId =>
      setState('activeEditorId', activeEditorId),
    )
    .hold(store.commands.setFocused, focused =>
      setState('options', 'focused', focused),
    )
    .hold(store.commands.setFontId, fontId =>
      setState('options', 'fontId', fontId),
    )
    .hold(store.commands.setThemeId, themeId =>
      setState('options', 'themeId', themeId),
    )
    .hold(store.commands.setFontWeight, fontWeight =>
      setState('options', 'fontWeight', fontWeight),
    )
    .hold(store.commands.setShowLineNumbers, showLineNumbers =>
      setState('options', 'showLineNumbers', showLineNumbers),
    )
    .hold(store.commands.setEnableLigatures, enable =>
      setState('options', 'enableLigatures', enable),
    )
    .hold(store.commands.setFromPreset, presetData => {
      setState('options', presetData);
      store.dispatch(editorUpdateCommand, void 0);
    })
    .hold(store.commands.setFromPersistedState, (persistedState, {state}) => {
      const editors = (persistedState.editors ?? [])
        .slice(0, MAX_EDITOR_TABS)
        .map(editor => ({
          tabName: editor.tabName,
          languageId: editor.languageId,
          id: editor.id,
          code: editor.code,
          lineNumberStart: editor.lineNumberStart,
          marks: editor.marks ?? {lines: [], focusedLines: []},
        }));
      return {
        options: {...state.options, ...persistedState.options},
        activeEditorId: editors[0]?.id ?? defaultId,
        editors: editors.length
          ? editors.map(editor => {
              return {
                code: editor.code,
                languageId: editor.languageId,
                tab: {tabName: editor.tabName},
                id: editor.id,
                lineNumberStart: editor.lineNumberStart,
                marks: editor.marks ?? {lines: [], focusedLines: []},
              };
            })
          : [getInitialEditorState()],
      };
    });

  const isActive = (id: string) => store.get.activeEditorId === id;
  const updateEditors = (update: (state: EditorState[]) => void) =>
    store.set(state => update(state.editors));
  const setEditors = createPathSetter<EditorState[]>(updateEditors);

  const mapToStateToPersistState = (
    state: typeof store.get,
  ): PersistedEditorState => {
    return {
      editors: state.editors.map(editor => {
        return {
          languageId: editor.languageId,
          code: editor.code,
          tabName: editor.tab.tabName ?? '',
          id: editor.id,
          lineNumberStart: editor.lineNumberStart ?? 1,
          marks: editor.marks ?? {lines: [], focusedLines: []},
        };
      }),
      options: {
        themeId: state.options.themeId,
        showLineNumbers: state.options.showLineNumbers,
        fontId: state.options.fontId,
        fontWeight: state.options.fontWeight,
        enableLigatures: state.options.enableLigatures ?? true,
      },
    };
  };

  const stateToPersist$ = from(
    store.watchCommand([
      store.commands.setFontId,
      store.commands.setThemeId,
      store.commands.setFontWeight,
      store.commands.setShowLineNumbers,
      store.commands.setEnableLigatures,
      editorUpdateCommand,
    ]),
  ).pipe(
    map(() => store.peek()),
    map(mapToStateToPersistState),
    shareReplay({refCount: true, bufferSize: 1}),
  );

  const addEditor = (
    editorState?: Partial<EditorState> | null,
    active?: boolean,
  ) => {
    if (store.get.editors.length === MAX_EDITOR_TABS) return;
    const id = createEditorId();
    const editor: EditorState = {
      ...getInitialEditorState(),
      tab: {
        tabName: null,
      },
      ...(editorState ?? {}),
      id,
    };
    if (editor.marks.script)
      editor.marks = {
        ...editor.marks,
        script: {
          ...editor.marks.script,
          steps: editor.marks.script.steps.map(() => createRandomId()),
        },
      };
    setEditors(editors => [...editors, editor]);
    if (active) setState('activeEditorId', id);
    store.dispatch(editorUpdateCommand, void 0);
  };

  const canAddEditor = () => store.get.editors.length < MAX_EDITOR_TABS;

  const removeEditor = (id: string) => {
    if (store.get.editors.length === 1) {
      return;
    }
    const $isActive = isActive(id);
    const currentIndex = store.get.editors.findIndex(
      editor => editor.id === id,
    );
    const newActiveEditor = store.get.editors[currentIndex - 1];
    const updatedEditors = store.get.editors.filter(editor => editor.id !== id);
    if ($isActive) {
      setState('activeEditorId', newActiveEditor?.id ?? updatedEditors[0]?.id);
    }
    setEditors(updatedEditors);
    store.dispatch(editorUpdateCommand, void 0);
  };

  const setTabName = (id: string, name: string, updateLanguage: boolean) => {
    const index = store.get.editors.findIndex(tab => tab.id === id);
    if (index < 0) return;
    setEditors(index, 'tab', 'tabName', name);
    if (updateLanguage) {
      const matches = SUPPORTED_LANGUAGES.filter(language => {
        return language.icons.some(({matcher}) => matcher.test(name));
      });
      if (
        !matches.length ||
        matches
          .map(match => match.id)
          .includes(store.get.editors[index].languageId)
      ) {
        return;
      }
      setEditors(index, 'languageId', matches[0].id);
    }
    store.dispatch(editorUpdateCommand, void 0);
  };

  const configuredFonts = () => [
    ...configStore.get.fonts,
    ...configStore.get.systemFonts,
  ];

  const selectedFont = () => {
    const font = configuredFonts().find(
      font => font.id === store.get.options.fontId,
    );
    return font ?? configuredFonts()[0];
  };

  const setFromWorkspace = (item: ApiTypes.GetProjectByIdApi['response']) => {
    setEditors(
      item.editorTabs.map(
        editor =>
          ({
            tab: {
              tabName: editor.tabName,
            },
            formatter: null,
            languageId: editor.languageId,
            id: editor.id,
            code: editor.code,
            lineNumberStart: editor.lineNumberStart ?? 1,
            marks: editor.marks ?? {lines: [], focusedLines: []},
          }) as EditorState,
      ),
    );
    setState('activeEditorId', item.editorTabs[0].id);
    setState('options', item.editorOptions);
    store.dispatch(editorUpdateCommand, void 0);
  };

  const setEditorsWithCommand: SetStoreFunction<EditorState[]> =
    createPathSetter(update => {
      updateEditors(update);
      store.dispatch(editorUpdateCommand, void 0);
    });

  return {
    get state() {
      return store.get;
    },
    setState,
    isActive,
    stateToPersist() {
      const state = store.peek();
      return mapToStateToPersistState(state);
    },
    stateToPersist$,
    activeEditorView,
    activeEditorViewTabId,
    computed: {
      selectedFont,
      canAddEditor,
    },
    actions: {
      setActiveEditorView,
      setActiveEditorViewTabId,
      setEditors: setEditorsWithCommand,
      addEditor,
      removeEditor,
      setTabName,
      setFromWorkspace,
      ...store.actions,
      setFontId(fontId: string) {
        store.actions.setFontId(fontId);
        const value = configuredFonts().find(font => font.id === fontId);
        if (
          !!value &&
          !value.types
            .map(({weight}) => weight)
            .includes(store.get.options.fontWeight)
        ) {
          const defaultValue =
            value.types.find(({weight}) => [400, 500].includes(weight)) ??
            value.types[0];
          store.actions.setFontWeight(defaultValue?.weight ?? 400);
        }
      },
    },
  } as const;
}
