import {
  createStore as $createStore,
  Reducer,
  select,
  withProps,
} from '@ngneat/elf';
import {distinctUntilChanged, map} from 'rxjs';
import {batch, createRoot, createSelector, createSignal} from 'solid-js';
import {createStore} from 'solid-js/store';
import {appEnvironment} from '../core/configuration';
import {SUPPORTED_FONTS} from '../core/configuration/font';
import shallow from '../core/helpers/shallow';
import {elfAutoSettersFactory} from '../core/store/elf-auto-setters-factory';

export interface TabsState {
  readonly tabName?: string;
  readonly tabIcon?: string;
}

export interface EditorState {
  readonly id: number;
  readonly languageId: string;
  readonly themeId: string;
  readonly code: string;
  readonly fontId: string;
  readonly fontWeight: number;
  readonly showLineNumbers: boolean;
  readonly focused: boolean;
  readonly tabIcon?: string;
}

const initialState: EditorState = {
  id: 0,
  code: appEnvironment.defaultState.editor.code,
  languageId: appEnvironment.defaultState.editor.languageId,
  themeId: appEnvironment.defaultState.editor.theme.id,
  showLineNumbers: false,
  fontId: appEnvironment.defaultState.editor.font.id,
  fontWeight: appEnvironment.defaultState.editor.font.types[0].weight,
  focused: false,
};

function $createTabs() {
  const [tabs, setTabs] = createStore<TabsState[]>([]);
  const setName = (id: number, name: string) => setTabs(id, 'tabName', name);
  const setIcon = (id: number, icon: string) => setTabs(id, 'tabIcon', icon);

  return {
    tabs,
    setTabs,
    setName,
    setIcon,
  } as const;
}

function $createEditors() {
  const [editors, setEditors] = createStore<EditorState[]>([]);
  const tabsState = $createTabs();
  const [$activeEditorIndex, $setActiveEditorIndex] = createSignal<number>();
  const $isActive = createSelector($activeEditorIndex);

  const setActiveEditor = (editor: EditorState) =>
    $setActiveEditorIndex(editor.id);

  const addEditor = (state?: Partial<EditorState> | null, active?: boolean) =>
    batch(() => {
      const id = editors.length;
      const editor = {...initialState, ...(state ?? {}), id};
      setEditors([...editors, editor]);
      tabsState.setTabs([...tabsState.tabs, {tabName: 'index.tsx'}]);
      if (active) setActiveEditor(editor);
    });

  return {
    editors,
    setEditors,
    tabs: tabsState.tabs,
    setTabs: tabsState.setTabs,
    isActive: $isActive,
    setActiveEditor,
    addEditor,
  } as const;
}

export const $rootEditorState = createRoot($createEditors);

const store = $createStore(
  {name: 'editor'},
  withProps<EditorState>(initialState),
);

export const updateEditorStore = (value: Reducer<EditorState>) =>
  store.update(value);

// persistState(store, {storage: localStorageStrategy, key: '@store/editor'});
//
// persistState(editorsStore, {
//   storage: localStorageStrategy,
//   key: '@store/editors',
// });

export const {
  setFocused: setFocus,
  setFontId,
  setFontWeight,
  setLanguageId,
  setShowLineNumbers,
  setThemeId: setTheme,
  setCode,
} = elfAutoSettersFactory(store);

export const editor$ = store.pipe(distinctUntilChanged(shallow));

const fontId$ = editor$.pipe(select(store => store.fontId));

export const editorLanguageId$ = editor$.pipe(
  select(store => store.languageId),
);

export const font$ = fontId$.pipe(
  map(id => SUPPORTED_FONTS.find(font => font.id === id)),
);

export const focusedEditor$ = editor$.pipe(select(store => store.focused));
