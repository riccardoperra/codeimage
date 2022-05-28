import {createStoreNotifier} from '@codeimage/store/plugins/store-notifier';
import {createUniqueId, versionateId} from '@codeimage/store/plugins/unique-id';
import {
  createStore as $createStore,
  Reducer,
  select,
  withProps,
} from '@ngneat/elf';
import {debounceTime, distinctUntilChanged, map} from 'rxjs';
import {
  batch,
  createRoot,
  createSelector,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import {createStore, unwrap} from 'solid-js/store';
import {appEnvironment} from '../core/configuration';
import {SUPPORTED_FONTS} from '../core/configuration/font';
import shallow from '../core/helpers/shallow';
import {elfAutoSettersFactory} from '../core/store/elf-auto-setters-factory';
import {useIdb} from '../hooks/use-indexed-db';

export interface TabsState {
  readonly tabId: string;
  readonly tabName: string | null;
  readonly tabIcon?: string;
}

export interface EditorState {
  readonly id: string;
  readonly languageId: string;
  readonly themeId: string;
  readonly code: string;
  readonly fontId: string;
  readonly fontWeight: number;
  readonly showLineNumbers: boolean;
  readonly focused: boolean;
  readonly tabIcon?: string;
}

const initialState: Omit<EditorState, 'id'> = {
  code: appEnvironment.defaultState.editor.code,
  languageId: appEnvironment.defaultState.editor.languageId,
  themeId: appEnvironment.defaultState.editor.theme.id,
  showLineNumbers: false,
  fontId: appEnvironment.defaultState.editor.font.id,
  fontWeight: appEnvironment.defaultState.editor.font.types[0].weight,
  focused: false,
};

type IndexedDbState = {
  readonly editors: readonly EditorState[];
  readonly tabs: readonly TabsState[];
};

function $createEditors() {
  const idb = useIdb();
  const [, withNotifier, onChange$] = createStoreNotifier();
  const [$activeEditorId, $setActiveEditorId] = createSignal<string>();
  const $isActive = createSelector($activeEditorId);

  const [tabs, setTabs] = createStore<TabsState[]>([]);
  const [editors, setEditors] = createStore<EditorState[]>([]);

  onMount(() => {
    idb
      .get<IndexedDbState>('$editor')
      .then(result => {
        if (!result) return;
        batch(() => {
          const tabs = result.tabs.map(tab => ({
            ...tab,
            tabId: versionateId(tab.tabId),
          }));
          $setActiveEditorId(tabs[0].tabId ?? null);
          setTabs(tabs);
          setEditors(
            result.editors.map(editor => ({
              ...editor,
              id: versionateId(editor.id),
            })),
          );
        });
      })
      .then(() => {
        const sub = onChange$.pipe(debounceTime(100)).subscribe(() => {
          const state: IndexedDbState = {editors, tabs};
          idb.set('$editor', unwrap(state));
        });
        onCleanup(() => sub.unsubscribe());
      });
  });

  const setActiveEditor = withNotifier((editor: EditorState) =>
    $setActiveEditorId(editor.id),
  );

  const addEditor = withNotifier(
    (state?: Partial<EditorState> | null, active?: boolean) =>
      batch(() => {
        const id = createUniqueId();
        const editor = {...initialState, ...(state ?? {}), id};
        setEditors(editors => [...editors, editor]);
        setTabs(tabs => [...tabs, {tabName: null, tabId: id}]);
        if (active) setActiveEditor(editor);
      }),
  );

  const removeEditor = withNotifier((id: string) =>
    batch(() => {
      setEditors(editors => editors.filter(editor => editor.id !== id));
      setTabs(tabs => tabs.filter(tab => tab.tabId !== id));
    }),
  );

  const setTabName = withNotifier((id: string, name: string) =>
    setTabs(
      tabs.findIndex(tab => tab.tabId === id),
      tab => ({
        ...tab,
        tabName: name,
      }),
    ),
  );

  return {
    tabs,
    editors,
    isActive: $isActive,
    removeEditor,
    setActiveEditor,
    addEditor,
    setTabName,
  } as const;
}

export const $rootEditorState = createRoot($createEditors);

const store = $createStore(
  {name: 'editor'},
  // TODO: to replace with new editor store
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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
