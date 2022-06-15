import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {createRoot} from 'solid-js';

export interface EditorState {
  readonly id: string;
  readonly languageId: string;
  readonly code: string;
}

function $activeEditors() {
  const {
    editors,
    actions: {setEditors},
    isActive,
  } = getRootEditorStore();
  const currentEditor = () => editors.find(editor => isActive(editor.id));

  const currentEditorIndex = () =>
    editors.findIndex(editor => editor.id === currentEditor()?.id);

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
