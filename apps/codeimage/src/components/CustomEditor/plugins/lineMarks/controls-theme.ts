import {EditorView} from '@codemirror/view';

export const controlsTheme = EditorView.theme({
  '.cm-lineNumbers .cm-gutterElement': {cursor: 'pointer'},
  '.cm-lineNumbers .cm-gutterElement:hover': {
    backgroundImage: 'linear-gradient(#8883, #8883)',
  },
  '.cm-line[data-mark-preview="highlight"], .cm-lineNumbers .cm-lineMarkPreview-highlight':
    {
      background:
        'var(--codeimage-line-highlight, rgba(128, 128, 128, 0.16)) !important',
      boxShadow:
        'inset 2px 0 var(--codeimage-line-accent, currentColor) !important',
    },
  '&[data-line-numbers="true"] .cm-line[data-mark-preview="highlight"]': {
    boxShadow: 'none !important',
  },
  '.cm-line[data-mark-preview="clear"], .cm-lineNumbers .cm-lineMarkPreview-clear':
    {
      background: 'none !important',
      boxShadow: 'none !important',
    },
  '.cm-tooltip.cm-lineMarkToolbar': {
    display: 'flex',
    background: '#232326',
    color: '#f4f4f5',
    border: '1px solid #ffffff1f',
    flexWrap: 'wrap',
    maxWidth: 'calc(100vw - 16px)',
    gap: '2px',
    padding: '3px',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '12px',
    lineHeight: '1',
    boxShadow: '0 4px 16px #0005',
  },
  '.cm-lineMarkToolbar button': {
    border: '0',
    borderRadius: '5px',
    background: 'transparent',
    color: 'inherit',
    padding: '6px 8px',
    cursor: 'pointer',
    font: 'inherit',
    whiteSpace: 'nowrap',
  },
  '.cm-lineMarkToolbar button:hover': {background: '#8883'},
  '.cm-lineMarkToolbar button[aria-pressed="true"]': {background: '#8884'},
  '.cm-lineMarkToolbar button:focus-visible': {
    outline: '2px solid currentColor',
    outlineOffset: '-2px',
  },
  '@media (pointer: coarse)': {
    '.cm-lineMarkToolbar button': {padding: '10px 12px'},
  },
});
