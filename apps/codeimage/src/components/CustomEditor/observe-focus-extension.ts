import {EditorView, ViewUpdate} from '@codemirror/view';

export const observeFocusExtension = (
  onFocusChange?: (focused: boolean, vu: ViewUpdate) => void,
  onRegister?: (vu: ViewUpdate) => void,
) => {
  let registered = false;
  return EditorView.updateListener.of((vu: ViewUpdate) => {
    if (!registered) {
      onRegister?.(vu);
      registered = true;
    }
    if (vu.focusChanged) {
      onFocusChange?.(vu.view.hasFocus, vu);
    }
  });
};
