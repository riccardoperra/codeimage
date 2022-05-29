import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {createRoot} from 'solid-js';
import {appEnvironment} from '../../core/configuration';

export interface TabsState {
  readonly tabId: string;
  readonly tabName: string | null;
  readonly tabIcon?: string;
}

export interface EditorSharedState {
  readonly fontId: string;
  readonly fontWeight: number;
  readonly showLineNumbers: boolean;
  readonly focused: boolean;
  readonly themeId: string;
}

export interface EditorState {
  readonly id: string;
  readonly languageId: string;
  readonly code: string;
}

const initialState: Omit<EditorState, 'id'> = {
  code: appEnvironment.defaultState.editor.code,
  languageId: appEnvironment.defaultState.editor.languageId,
};

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
