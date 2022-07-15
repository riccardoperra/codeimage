import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {createUniqueId, versionateId} from '@codeimage/store/plugins/unique-id';
import {appEnvironment} from '@core/configuration';
import {SUPPORTED_FONTS} from '@core/configuration/font';
import makeStore from '@core/store/makeStore';
import {filter} from '@solid-primitives/immutable';
import {combineLatest, map} from 'rxjs';
import {
  batch,
  createMemo,
  createRoot,
  createSelector,
  createSignal,
  onMount,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {useIdb} from '../../hooks/use-indexed-db';
import {WorkspaceItem} from '../../pages/Dashboard/dashboard.state';
import {getRootEditorOptions} from './createEditorOptions';
import {EditorState, PersistedEditorState} from './model';

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

function $createEditorsStore() {
  const IDB_KEY = 'editor';
  const MAX_TABS = 6;
  const idb = useIdb();

  const [options, setOptions, optionsState$, optionActions] =
    getRootEditorOptions();
  const [editors, setEditors, {state$: editorState$}] = makeStore([
    getInitialEditorState(),
  ]);

  const [ready, setReady] = createSignal(false);
  const [activeEditorId, setActiveEditorId] = createSignal<string>(defaultId);
  const isActive = createSelector(activeEditorId);

  const state$ = combineLatest([editorState$, optionsState$]).pipe(
    map(([editors, options]) => ({options, editors})),
  );

  onMount(async () => {
    const idbState = await idb
      .get<PersistedEditorState>(IDB_KEY)
      .catch(() => null);
    if (idbState) {
      // Versioning state tabs -> TODO: not needed if id is not createUniqueId from solid
      const editors = idbState.editors.slice(0, MAX_TABS).map(editor => ({
        ...editor,
        id: versionateId(editor.id),
      }));
      setOptions(idbState.options);
      setActiveEditorId(editors[0].id);
      setEditors(editors);
    }
    setReady(true);
  });

  const addEditor = (state?: Partial<EditorState> | null, active?: boolean) => {
    if (editors.length === MAX_TABS) return;
    batch(() => {
      const id = createUniqueId();
      const editor: EditorState = {
        ...getInitialEditorState(),
        tab: {
          tabName: null,
        },
        ...(state ?? {}),
        id,
      };
      setEditors(editors => [...editors, editor]);
      if (active) setActiveEditorId(id);
    });
  };

  const canAddEditor = () => editors.length < MAX_TABS;

  const removeEditor = (id: string) => {
    if (editors.length === 1) {
      return;
    }
    const $isActive = isActive(id);
    const currentIndex = editors.findIndex(editor => editor.id === id);
    const newActiveEditor = editors[currentIndex - 1];
    const updatedEditors = editors.filter(editor => editor.id !== id);
    if ($isActive) {
      setActiveEditorId(newActiveEditor?.id ?? updatedEditors[0]?.id);
    }
    setEditors(updatedEditors);
  };

  const setTabName = (id: string, name: string, updateLanguage: boolean) => {
    const index = editors.findIndex(tab => tab.id === id);
    setEditors(index, 'tab', 'tabName', name);
    if (updateLanguage) {
      const matches = SUPPORTED_LANGUAGES.filter(language => {
        return language.icons.some(({matcher}) => matcher.test(name));
      });
      if (
        !matches.length ||
        matches.map(match => match.id).includes(editors[index].languageId)
      ) {
        return;
      }
      setEditors(index, 'languageId', matches[0].id);
    }
  };

  const font = createMemo(
    () => filter(SUPPORTED_FONTS, font => font.id === options.fontId)[0],
  );

  const setFromWorkspace = (item: WorkspaceItem) => {
    setEditors(
      item.snippets.editors.map(editor => ({
        ...editor,
        code: window.atob(editor.code),
      })),
    );
    setActiveEditorId(item.snippets.editors[0].id);
    setOptions(item.snippets.options);
  };

  return {
    ready,
    state$,
    editors,
    options,
    isActive,
    get stateToPersist(): PersistedEditorState {
      const $$editor = unwrap(editors);
      const $$options = unwrap(options);
      return {
        editors: $$editor.map(editor => ({
          ...editor,
          code: window.btoa(editor.code),
        })),
        options: $$options,
      };
    },
    computed: {
      font,
      canAddEditor,
    },
    actions: {
      addEditor,
      setEditors,
      removeEditor,
      setActiveEditorId,
      setTabName,
      setFromWorkspace,
      ...optionActions,
    },
  } as const;
}

const createEditorStore = createRoot($createEditorsStore);

export function getRootEditorStore() {
  return createEditorStore;
}
