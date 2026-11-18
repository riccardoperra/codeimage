import {fleetDarkTheme} from '@codeimage/highlight/themes';
import {createPathSetter} from '@codeimage/atomic-state';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import type * as Solid from 'solid-js';
import {createRoot, flush} from 'solid-js';
import {expect, test, vi} from 'vitest';
import {createEditorStore} from './index';

vi.mock('solid-js', () =>
  vi.importActual<typeof Solid>(
    new URL('./dist/solid.js', import.meta.resolve('solid-js/package.json'))
      .pathname,
  ),
);
vi.mock('./editor', () => ({createEditorsStore: () => ({})}));
vi.mock('./animation', () => ({createAnimationStore: () => ({})}));
vi.mock('./terminal', async () => {
  const {createStore} = await import('solid-js');
  return {
    createTerminalState: () => {
      const [state, setState] = createStore({background: '', textColor: ''});
      return {state, setState: createPathSetter(setState)};
    },
  };
});
vi.mock('./frame', async () => {
  const {createStore} = await import('solid-js');
  return {
    getFrameState: () => {
      const [store, setStore] = createStore<{background: string | null}>({
        background: null,
      });
      return {
        store,
        setStore: createPathSetter(setStore),
        setBackground: (background: string) =>
          setStore(state => {
            state.background = background;
          }),
      };
    },
  };
});
vi.mock('@codeimage/store/theme/theme.store', async () => {
  const {createSignal} = await import('solid-js');
  const [resource, mutate] = createSignal<unknown>();
  return {
    getThemeStore: () => ({
      getThemeResource: () => [
        Object.defineProperty(resource, 'latest', {get: resource}),
        {mutate},
      ],
    }),
  };
});

test.each([false, true])(
  'late default theme preserves restored colours: %s',
  async restored => {
    const [, {mutate}] = getThemeStore().getThemeResource('fleetDark');
    mutate(undefined);
    const {store, dispose} = createRoot(dispose => ({
      store: createEditorStore(),
      dispose,
    }));
    if (restored) {
      store.terminal.setState('background', '#282a36');
      store.terminal.setState('textColor', '#BD93F9');
      store.frame.setStore('background', '#abcdef');
    }
    flush();
    await Promise.resolve();
    mutate(fleetDarkTheme);
    flush();
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
  },
);
