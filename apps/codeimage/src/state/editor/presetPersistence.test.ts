import type * as Solid from 'solid-js';
import {createComponent, createRoot, flush, untrack} from 'solid-js';
import {StoreProvider} from 'statebuilder';
import {expect, test, vi} from 'vitest';
import {createEditorsStore} from './editor';
import type {PersistedEditorState} from './model';

vi.mock('solid-js', () =>
  vi.importActual<typeof Solid>(
    new URL('./dist/solid.js', import.meta.resolve('solid-js/package.json'))
      .pathname,
  ),
);
vi.mock('@codeimage/store/editor/config.store', async () => {
  const {defineStore} = await import('statebuilder');
  return {EditorConfigStore: defineStore(() => ({fonts: [], systemFonts: []}))};
});

test('applying a preset emits the updated editor options for persistence', () =>
  createRoot(dispose => {
    createComponent(StoreProvider, {
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

test('closing a tab removes it from the editor and its persisted snapshot', () =>
  createRoot(dispose => {
    createComponent(StoreProvider, {
      get children() {
        return untrack(() => {
          const editor = createEditorsStore();
          editor.actions.addEditor(null, true);
          flush();
          const [first, second] = editor.stateToPersist().editors;
          expect(second).toBeDefined();
          editor.actions.removeEditor(second.id);
          flush();
          expect(editor.stateToPersist().editors).toEqual([first]);
          expect(editor.isActive(first.id)).toBe(true);
          return null;
        });
      },
    });
    dispose();
  }));
