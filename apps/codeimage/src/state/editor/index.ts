import {experimental} from '@codeimage/atomic-state';
import {createEditorsStore} from '@codeimage/store/editor/editor';
import {createFrameState} from '@codeimage/store/editor/frame';
import {createTerminalState} from '@codeimage/store/editor/terminal';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {createEffect, createRoot, createSignal, on} from 'solid-js';

export function createEditorStore() {
  const terminal = createTerminalState();
  const [initialized, setInitialized] = createSignal(false);
  const registry = getThemeStore();
  const frame = createFrameState();
  const editor = createEditorsStore();

  const [resource] = registry.getThemeResource('vsCodeDarkTheme');

  createEffect(
    on(resource, async resource => {
      if (resource) {
        experimental.untrackCommand(() => {
          terminal.setState('background', resource.properties.terminal.main);
          terminal.setState('textColor', resource.properties.terminal.text);
          if (frame.store.background === null) {
            frame.setBackground(resource.properties.previewBackground);
          }
        }, false);
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
