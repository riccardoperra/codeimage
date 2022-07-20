import {getRootEditorStore} from '@codeimage/store/editor';
import {getStoreInternals} from '@codeimage/atomic-state';
import {createRoot} from 'solid-js';

export interface EditorState {
  readonly id: string;
  readonly languageId: string;
  readonly code: string;
}

function $activeEditors() {
  const {state, isActive} = getRootEditorStore();
  const {$$setter: setState} = getStoreInternals(state);
  const currentEditor = () => state.editors.find(editor => isActive(editor.id));

  const currentEditorIndex = () =>
    state.editors.findIndex(editor => editor.id === currentEditor()?.id);

  const setLanguageId = (languageId: string) =>
    setState('editors', currentEditorIndex(), 'languageId', languageId);

  const setCode = (code: string) =>
    setState('editors', currentEditorIndex(), 'code', code);

  return {
    editor: currentEditor,
    setLanguageId,
    setCode,
  };
}

const $activeEditorState = createRoot($activeEditors);

export function getActiveEditorStore() {
  return $activeEditorState;
}
