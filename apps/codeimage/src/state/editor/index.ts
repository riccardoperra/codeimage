import {createEditorsStore} from '@codeimage/store/editor/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {createTerminalState} from '@codeimage/store/editor/terminal';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {createEffect, createSignal, on} from 'solid-js';
import {untrackCommand} from 'statebuilder/commands';

export function createEditorStore() {
  const terminal = createTerminalState();
  const [initialized, setInitialized] = createSignal(false);
  const registry = getThemeStore();
  const frame = getFrameState();
  const editor = createEditorsStore();

  const [resource] = registry.getThemeResource('vsCodeDarkTheme');

  createEffect(
    on(resource, async resource => {
      if (resource) {
        untrackCommand(() => {
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

let store: ReturnType<typeof createEditorStore>;
const editorStore = () => {
  if (!store) store = createEditorStore();
  return store;
};

export function getEditorStore() {
  return editorStore();
}

export function getRootEditorStore() {
  return editorStore().editor;
}
