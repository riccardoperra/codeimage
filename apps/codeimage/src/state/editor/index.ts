import {createEditorsStore} from '@codeimage/store/editor/editor';
import {createFrameState} from '@codeimage/store/editor/frame';
import {createTerminalState} from '@codeimage/store/editor/terminal';
import {
  EditorFinalState,
  PersistedEditorState,
  TerminalState,
} from '@codeimage/store/editor/model';
import {versionateId} from '@codeimage/store/plugins/unique-id';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {
  batch,
  createEffect,
  createRoot,
  createSignal,
  on,
  onMount,
} from 'solid-js';
import {useIdb} from '../../hooks/use-indexed-db';

export type EditorState = {
  terminal: TerminalState;
};

export function createEditorStore() {
  const terminal = createTerminalState();
  const [initialized, setInitialized] = createSignal(false);
  const registry = getThemeStore();
  const frame = createFrameState();
  const editor = createEditorsStore();
  const idb = useIdb();

  const [resource] = registry.getThemeResource('vsCodeDarkTheme');

  createEffect(
    on(resource, async resource => {
      if (resource) {
        terminal.setState('background', resource.properties.terminal.main);
        terminal.setState('textColor', resource.properties.terminal.text);
        if (frame.store.background === null) {
          console.log(frame);
          frame.setBackground(resource.properties.previewBackground);
        }

        const idbState = await idb
          .get<EditorFinalState>('document')
          .catch(() => null);

        if (idbState) {
          editor.actions.setFromPersistedState(idbState.editor);
          frame.setFromPersistedState(idbState.frame);
          terminal.setFromPersistedState(idbState.terminal);
        }
        setInitialized(true);
      }
    }),
  );

  return {
    terminal,
    frame,
    editor,
    initialized,
  };
}

export const editorStore = createRoot(createEditorStore);

export function getEditorStore() {
  return editorStore;
}

export function getRootEditorStore() {
  return editorStore.editor;
}
