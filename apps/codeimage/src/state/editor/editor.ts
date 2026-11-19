import {
  defaultId,
  getInitialEditorState,
  getInitialEditorUiOptions,
} from './initialState';
export {getInitialEditorState, getInitialEditorUiOptions} from './initialState';
import type * as ApiTypes from '@codeimage/api/api-types';
import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {provideAppState} from '@codeimage/store/index';
import {
  createEditorId,
  createRandomId,
} from '@codeimage/store/plugins/unique-id';
import type {PresetData} from '@codeimage/store/presets/types';
import type {EditorView} from '@codemirror/view';
import {createSignal} from 'solid-js';
import {defineStore, useStore} from 'statebuilder';
import {createCommand, withProxyCommands} from 'statebuilder/commands';
import type {EditorState, PersistedEditorState} from './model';
import {persistedEditorState} from './persistedEditorState';
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

  const configStore = useStore(EditorConfigStore);

  const editorUpdateCommand = createCommand('editorUpdate').withPayload<void>();

  store
    .hold(store.commands.setActiveEditorId, activeEditorId =>
      store.set(draft => {
        draft.activeEditorId = activeEditorId;
      }),
    )
    .hold(store.commands.setFocused, focused =>
      store.set(draft => {
        draft.options.focused = focused;
      }),
    )
    .hold(store.commands.setFontId, fontId =>
      store.set(draft => {
        draft.options.fontId = fontId;
      }),
    )
    .hold(store.commands.setThemeId, themeId =>
      store.set(draft => {
        draft.options.themeId = themeId;
      }),
    )
    .hold(store.commands.setFontWeight, fontWeight =>
      store.set(draft => {
        draft.options.fontWeight = fontWeight;
      }),
    )
    .hold(store.commands.setShowLineNumbers, showLineNumbers =>
      store.set(draft => {
        draft.options.showLineNumbers = showLineNumbers;
      }),
    )
    .hold(store.commands.setEnableLigatures, enable =>
      store.set(draft => {
        draft.options.enableLigatures = enable;
      }),
    )
    .hold(store.commands.setFromPreset, presetData => {
      store.set(draft => {
        Object.assign(draft.options, presetData);
      });
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
  const persistence = store.watchCommand([
    store.commands.setFontId,
    store.commands.setThemeId,
    store.commands.setFontWeight,
    store.commands.setShowLineNumbers,
    store.commands.setEnableLigatures,
    editorUpdateCommand,
  ]);

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
    store.set(draft => {
      draft.editors.push(editor);
      if (active) draft.activeEditorId = id;
    });
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
    store.set(draft => {
      if ($isActive)
        draft.activeEditorId = newActiveEditor?.id ?? updatedEditors[0]?.id;
      draft.editors = updatedEditors;
    });
    store.dispatch(editorUpdateCommand, void 0);
  };

  const setTabName = (id: string, name: string, updateLanguage: boolean) => {
    const index = store.get.editors.findIndex(tab => tab.id === id);
    if (index < 0) return;
    store.set(draft => {
      draft.editors[index].tab.tabName = name;
    });
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
      store.set(draft => {
        draft.editors[index].languageId = matches[0].id;
      });
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
    store.set(draft => {
      draft.editors = item.editorTabs.map(editor => ({
        tab: {tabName: editor.tabName},
        formatter: null,
        languageId: editor.languageId,
        id: editor.id,
        code: editor.code,
        lineNumberStart: editor.lineNumberStart ?? 1,
        marks: editor.marks ?? {lines: [], focusedLines: []},
      }));
      draft.activeEditorId = item.editorTabs[0].id;
      Object.assign(draft.options, item.editorOptions);
    });
    store.dispatch(editorUpdateCommand, void 0);
  };

  const replaceEditors = (editors: EditorState[]) => {
    store.set(draft => {
      draft.editors = editors;
    });
    store.dispatch(editorUpdateCommand, void 0);
  };

  const updateEditor = (
    id: string | undefined,
    update: (draft: EditorState) => void,
  ) => {
    let updated = false;
    store.set(draft => {
      const editor = draft.editors.find(editor => editor.id === id);
      if (!editor) return;
      update(editor);
      updated = true;
    });
    if (updated) store.dispatch(editorUpdateCommand, void 0);
  };

  return {
    get state() {
      return store.get;
    },
    setState: store.set,
    isActive,
    stateToPersist() {
      const state = store.peek();
      return persistedEditorState(state);
    },
    onPersistedChange(listener: (state: PersistedEditorState) => void) {
      const subscription = persistence.subscribe(() =>
        listener(persistedEditorState(store.peek())),
      );
      return () => subscription.unsubscribe();
    },
    activeEditorView,
    activeEditorViewTabId,
    computed: {
      selectedFont,
      canAddEditor,
    },
    actions: {
      setActiveEditorView,
      setActiveEditorViewTabId,
      replaceEditors,
      updateEditor,
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
