import {createAnimationStore} from '@codeimage/store/editor/animation';
import {createEditorsStore} from '@codeimage/store/editor/editor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {createTerminalState} from '@codeimage/store/editor/terminal';
import {getAppStateContainer} from '@codeimage/store/index';
export {AppStateProvider as EditorStoreProvider} from '@codeimage/store/index';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {createEffect, createSignal} from 'solid-js';
import {untrackCommand} from 'statebuilder/commands';

export function createEditorStore() {
  const terminal = createTerminalState();
  const [initialized, setInitialized] = createSignal(false);
  const registry = getThemeStore();
  const frame = getFrameState();
  const editor = createEditorsStore();
  const animation = createAnimationStore(editor);

  const [resource] = registry.getThemeResource('fleetDark');

  createEffect(
    () => resource.latest,
    resource => {
      if (resource) {
        untrackCommand(() => {
          terminal.setState(
            'background',
            background => background || resource.properties.terminal.main,
          );
          terminal.setState(
            'textColor',
            textColor => textColor || resource.properties.terminal.text,
          );
          frame.setStore(
            'background',
            background => background ?? resource.properties.previewBackground,
          );
        }, false);
        setInitialized(true);
      }
    },
  );

  return {
    terminal,
    frame,
    editor,
    animation,
    initialized,
  };
}

const editorStores = new WeakMap<
  ReturnType<typeof getAppStateContainer>,
  ReturnType<typeof createEditorStore>
>();

export function getEditorStore() {
  const container = getAppStateContainer();
  const existing = editorStores.get(container);
  if (existing) return existing;
  const store = createEditorStore();
  editorStores.set(container, store);
  return store;
}

export function getRootEditorStore() {
  return getEditorStore().editor;
}
