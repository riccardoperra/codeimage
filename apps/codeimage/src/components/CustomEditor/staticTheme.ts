import type {CustomTheme} from '@codeimage/highlight';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {StyleModule} from 'style-mod';
import {baseEditorTheme} from './editorTheme';

function themeClasses(extension: unknown): string[] {
  if (Array.isArray(extension)) return extension.flatMap(themeClasses);
  if (!extension || typeof extension !== 'object') return [];
  if ('extension' in extension) return themeClasses(extension.extension);
  if ('value' in extension && typeof extension.value === 'string')
    return [extension.value];
  return [];
}

export const staticLayout = EditorView.theme({
  '&.cm-editor': {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  '&.cm-editor .cm-scroller': {
    display: 'grid !important',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    alignItems: 'start !important',
    fontFamily: 'monospace',
    lineHeight: '1.4',
    padding: '4px 0',
    height: 'auto',
  },
  '&.cm-editor .cm-content, &.cm-editor .cm-gutters, &.cm-editor .cm-lineNumbers':
    {
      // Beats CodeMirror's `.cm-gutter {display: flex !important}`, which would misalign numbers and lines.
      display: 'grid !important',
      gridTemplateRows: 'subgrid',
      gridRow: '1 / -1',
      margin: 0,
      padding: 0,
      minWidth: 0,
      minHeight: 0,
    },
  '&.cm-editor .cm-content': {
    gridColumn: '2',
    whiteSpace: 'break-spaces',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    tabSize: '4',
  },
  '&.cm-editor .cm-gutters, &.cm-editor .cm-lineNumbers': {gridColumn: '1'},
  '&.cm-editor .cm-content *': {
    fontFamily: 'var(--codeimage-font-family)',
    fontWeight: 'var(--codeimage-font-weight)',
    fontVariantLigatures: 'var(--codeimage-font-ligatures)',
  },
  '&.cm-editor .cm-gutters': {
    fontFamily: 'var(--codeimage-font-family)',
    fontWeight: 400,
    fontVariantLigatures: 'var(--codeimage-font-ligatures)',
  },
  '&.cm-editor .cm-gutterElement': {gridColumn: '1'},
  '&.cm-editor .cm-line': {display: 'block'},
});

// Keep the probe rules unmounted; only their shared scope names belong on the view.
const baseScopes = EditorState.create({
  extensions: EditorView.baseTheme({
    '&': {color: 'inherit'},
    '&light': {color: 'inherit'},
    '&dark': {color: 'inherit'},
  }),
})
  .facet(EditorView.styleModule)
  .flatMap(module =>
    Array.from(module.getRules().matchAll(/\.(ͼ[\w]+)/g), match => match[1]),
  );

const themes = new WeakMap<
  CustomTheme,
  {classes: string; modules: readonly StyleModule[]}
>();

const staticExtensions = (theme: CustomTheme) => [
  theme.editorTheme,
  baseEditorTheme,
  staticLayout,
];

type MountStyles = (this: {state: EditorState; root: unknown}) => void;

export function staticThemeCss(theme: CustomTheme): string {
  const style = {textContent: ''};
  const root = {head: {insertBefore() {}}, createElement: () => style};
  const {mountStyles} = EditorView.prototype as unknown as {
    mountStyles: MountStyles;
  };
  const state = EditorState.create({extensions: staticExtensions(theme)});
  mountStyles.call({state, root});
  return style.textContent;
}

export function getStaticTheme(theme: CustomTheme) {
  let resolved = themes.get(theme);
  if (!resolved) {
    const extensions = staticExtensions(theme);
    const state = EditorState.create({extensions});
    const modules = state.facet(EditorView.styleModule).slice().reverse();
    const classes = [
      ...themeClasses(extensions),
      baseScopes[0],
      // CodeMirror picks the scope from this facet. Themes from defineEditorTheme never set it, even dark ones.
      baseScopes[state.facet(EditorView.darkTheme) ? 2 : 1],
    ];
    resolved = {classes: Array.from(new Set(classes)).join(' '), modules};
    themes.set(theme, resolved);
  }
  return resolved;
}

export function mountStaticTheme(
  root: Document | ShadowRoot,
  theme: CustomTheme,
) {
  StyleModule.mount(root, getStaticTheme(theme).modules);
}
