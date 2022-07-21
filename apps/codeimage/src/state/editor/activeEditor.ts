import {getRootEditorStore} from '@codeimage/store/editor';
import {createRoot} from 'solid-js';

function $activeEditors() {
  const {
    state,
    isActive,
    actions: {setEditors},
  } = getRootEditorStore();
  const currentEditor = () => state.editors.find(editor => isActive(editor.id));

  const currentEditorIndex = () =>
    state.editors.findIndex(editor => editor.id === currentEditor()?.id);

  const setLanguageId = (languageId: string) =>
    setEditors(currentEditorIndex(), 'languageId', languageId);

  const setCode = (code: string) =>
    setEditors(currentEditorIndex(), 'code', code);

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
