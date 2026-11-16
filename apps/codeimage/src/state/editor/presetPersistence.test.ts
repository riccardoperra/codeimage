import type * as Solid from 'solid-js';
import type * as SolidStore from 'solid-js/store';
import {createComponent, createRoot, untrack} from 'solid-js';
import {StateProvider} from 'statebuilder';
import {expect, test, vi} from 'vitest';
import {createEditorsStore} from './editor';
import type {PersistedEditorState} from './model';

vi.mock('solid-js', () =>
  vi.importActual<typeof Solid>('solid-js/dist/solid.js'),
);
vi.mock('solid-js/store', () =>
  vi.importActual<typeof SolidStore>('solid-js/store/dist/store.js'),
);
vi.mock('@codeimage/store/editor/config.store', async () => {
  const {defineStore} = await import('statebuilder');
  return {EditorConfigStore: defineStore(() => ({fonts: [], systemFonts: []}))};
});

test('applying a preset emits the updated editor options for persistence', () =>
  createRoot(dispose => {
    createComponent(StateProvider, {
      get children() {
        return untrack(() => {
          const editor = createEditorsStore();
          const saves: PersistedEditorState[] = [];
          const subscription = editor.stateToPersist$.subscribe(state =>
            saves.push(state),
          );
          const options = {
            ...editor.stateToPersist().options,
            themeId: 'githubLight',
            showLineNumbers: true,
          };
          editor.actions.setFromPreset(options);
          expect(saves).toHaveLength(1);
          expect(saves[0].options).toEqual(options);
          subscription.unsubscribe();
          return null;
        });
      },
    });
    dispose();
  }));
