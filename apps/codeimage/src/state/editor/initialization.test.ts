import {fleetDarkTheme} from '@codeimage/highlight/themes';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import type * as Solid from 'solid-js';
import type * as SolidStore from 'solid-js/store';
import {createRoot} from 'solid-js';
import {expect, test, vi} from 'vitest';
import {createEditorStore} from './index';

vi.mock('solid-js', () =>
  vi.importActual<typeof Solid>('solid-js/dist/solid.js'),
);
vi.mock('solid-js/store', () =>
  vi.importActual<typeof SolidStore>('solid-js/store/dist/store.js'),
);
vi.mock('./editor', () => ({createEditorsStore: () => ({})}));
vi.mock('./animation', () => ({createAnimationStore: () => ({})}));
vi.mock('./terminal', async () => {
  const {createStore} = await import('solid-js/store');
  return {
    createTerminalState: () => {
      const [state, setState] = createStore({background: '', textColor: ''});
      return {state, setState};
    },
  };
});
vi.mock('./frame', async () => {
  const {createStore} = await import('solid-js/store');
  return {
    getFrameState: () => {
      const [store, setStore] = createStore<{background: string | null}>({
        background: null,
      });
      return {
        store,
        setStore,
        setBackground: (background: string) =>
          setStore('background', background),
      };
    },
  };
});
vi.mock('@codeimage/store/theme/theme.store', async () => {
  const {createSignal} = await import('solid-js');
  const [resource, mutate] = createSignal<unknown>();
  return {
    getThemeStore: () => ({getThemeResource: () => [resource, {mutate}]}),
  };
});

test.each([false, true])(
  'late default theme preserves restored colours: %s',
  async restored =>
    createRoot(async dispose => {
      const [, {mutate}] = getThemeStore().getThemeResource('fleetDark');
      mutate(undefined);
      const store = createEditorStore();
      if (restored) {
        store.terminal.setState('background', '#282a36');
        store.terminal.setState('textColor', '#BD93F9');
        store.frame.setStore('background', '#abcdef');
      }
      await Promise.resolve();
      mutate(fleetDarkTheme);
      expect(store.terminal.state.background).toBe(
        restored ? '#282a36' : fleetDarkTheme.properties.terminal.main,
      );
      expect(store.terminal.state.textColor).toBe(
        restored ? '#BD93F9' : fleetDarkTheme.properties.terminal.text,
      );
      expect(store.frame.store.background).toBe(
        restored ? '#abcdef' : fleetDarkTheme.properties.previewBackground,
      );
      expect(store.initialized()).toBe(true);
      dispose();
    }),
);
