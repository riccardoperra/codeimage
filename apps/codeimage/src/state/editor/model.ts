export interface EditorUIOptions {
  readonly fontId: string;
  readonly fontWeight: number;
  readonly showLineNumbers: boolean;
  readonly focused: boolean;
  readonly themeId: string;
}

export interface TabState {
  readonly tabName: string | null;
  readonly tabIcon?: string;
}

export interface EditorState {
  readonly id: string;
  readonly code: string;
  readonly tab: TabState;
  readonly languageId: string;
}

export interface PersistedEditorState {
  readonly options: EditorUIOptions;
  readonly editors: readonly EditorState[];
}
