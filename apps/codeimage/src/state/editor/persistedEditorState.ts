import type {EditorState, EditorUIOptions, PersistedEditorState} from './model';

export function persistedEditorState(state: {
  editors: EditorState[];
  options: EditorUIOptions;
}): PersistedEditorState {
  return {
    editors: state.editors.map(editor => {
      return {
        languageId: editor.languageId,
        code: editor.code,
        tabName: editor.tab.tabName ?? '',
        id: editor.id,
        lineNumberStart: editor.lineNumberStart ?? 1,
        marks: editor.marks ?? {lines: [], focusedLines: []},
      };
    }),
    options: {
      themeId: state.options.themeId,
      showLineNumbers: state.options.showLineNumbers,
      fontId: state.options.fontId,
      fontWeight: state.options.fontWeight,
      enableLigatures: state.options.enableLigatures ?? true,
    },
  };
}
