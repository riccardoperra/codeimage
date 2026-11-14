import './marks.css';
import {EditorView} from '@codemirror/view';

export const lineMarksStyle = EditorView.theme({
  '.cm-lineNumbers .cm-gutterElement': {
    position: 'relative',
    cursor: 'pointer',
  },
  '.cm-lineNumbers .cm-gutterElement:hover::before': {
    content: '"◇"',
    position: 'absolute',
    left: '-.5em',
    color: 'currentColor',
  },
  '.cm-lineMarkToolbar': {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    borderRadius: '6px',
    backgroundColor: 'Canvas',
    color: 'CanvasText',
    boxShadow: '0 2px 12px #0004',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '12px',
  },
  '.cm-lineMarkToolbar button': {
    border: '0',
    borderRadius: '4px',
    background: 'transparent',
    color: 'inherit',
    padding: '4px 6px',
    cursor: 'pointer',
    font: 'inherit',
  },
  '.cm-lineMarkToolbar button:hover': {background: '#8883'},
  '.cm-lineMarkToolbar button[aria-pressed="true"]': {background: '#8884'},
});
