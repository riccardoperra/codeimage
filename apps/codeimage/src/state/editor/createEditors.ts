import {createStoreNotifier} from '@codeimage/store/plugins/store-notifier';
import {createUniqueId, versionateId} from '@codeimage/store/plugins/unique-id';
import {filter} from '@solid-primitives/immutable';
import {debounceTime} from 'rxjs';
import {
  batch,
  createEffect,
  createMemo,
  createRoot,
  createSelector,
  createSignal,
  from,
  on,
  onMount,
} from 'solid-js';
import {createStore, unwrap} from 'solid-js/store';
import {appEnvironment} from '../../core/configuration';
import {SUPPORTED_FONTS} from '../../core/configuration/font';
import {useIdb} from '../../hooks/use-indexed-db';
import {getRootEditorOptions} from './createEditorOptions';
import {EditorState, PersistedEditorState} from './model';

const defaultId = createUniqueId();

function getInitialEditorState(): EditorState {
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
  const [, withNotifier, version$] = createStoreNotifier();
  const [options, setOptions, optionsActions] = getRootEditorOptions();
  const [editors, setEditors] = createStore([getInitialEditorState()]);
  const [ready, setReady] = createSignal(false);
  const [activeEditorId, setActiveEditorId] = createSignal<string>(defaultId);
  const isActive = createSelector(activeEditorId);

  onMount(async () => {
    const idbState = await idb.get<PersistedEditorState>(IDB_KEY);
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

  createEffect(
    on([from(version$.pipe(debounceTime(1000))), ready], ([_, ready]) => {
      if (!ready) return;
      const state: PersistedEditorState = {editors, options};
      idb.set(IDB_KEY, unwrap(state));
    }),
  );

  const addEditor = withNotifier(
    (state?: Partial<EditorState> | null, active?: boolean) => {
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
    },
  );

  const canAddEditor = () => editors.length < MAX_TABS;

  const removeEditor = withNotifier((id: string) => {
    if (editors.length === 1) {
      return;
    }
    const $isActive = isActive(id);
    const currentIndex = editors.findIndex(editor => editor.id === id);
    const newActiveEditor = editors[currentIndex - 1];
    setEditors(editors => editors.filter(editor => editor.id !== id));
    if ($isActive) {
      setActiveEditorId(newActiveEditor?.id ?? editors[0]?.id);
    }
  });

  const setTabName = withNotifier((id: string, name: string) =>
    setEditors(
      editors.findIndex(tab => tab.id === id),
      'tab',
      'tabName',
      name,
    ),
  );

  const font = createMemo(
    () => filter(SUPPORTED_FONTS, font => font.id === options.fontId)[0],
  );

  return {
    ready,
    editors,
    options,
    isActive,
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
      ...optionsActions,
    },
  } as const;
}

const createEditorStore = createRoot($createEditorsStore);

export function getRootEditorStore() {
  return createEditorStore;
}
