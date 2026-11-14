import {EditorView} from '@codemirror/view';

export const baseEditorTheme = EditorView.theme({
  '&': {
    textAlign: 'left',
    background: 'transparent !important',
  },
  '.cm-content': {
    textAlign: 'left',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
  },
  '.cm-lineNumbers': {
    position: 'sticky',
    flexDirection: 'column',
    flexShrink: 0,
  },
  '.cm-lineNumbers .cm-gutterElement': {
    textAlign: 'right',
    padding: '0 16px 0 8px',
  },
  '.cm-line': {
    padding: '0 2px 0 8px',
  },
  '.cm-cursor': {
    borderLeftWidth: '2px',
    height: '21px',
    transform: 'translateY(-10%)',
  },
});
