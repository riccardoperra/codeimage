import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {
  createCodeMirror,
  createCompartmentExtension,
  createEditorControlledValue,
  createEditorReadonly,
  createLazyCompartmentExtension,
} from 'solid-codemirror';
import {theme} from './editor-theme';

export {
  createEditorReadonly,
  createLazyCompartmentExtension,
  createEditorControlledValue,
  createCodeMirror,
  EditorView,
  createCompartmentExtension,
  EditorState,
  theme,
};
