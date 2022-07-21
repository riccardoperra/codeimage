import {PersistedFrameState} from '@codeimage/store/frame/model';

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

export interface EditorUIOptions {
  readonly fontId: string;
  readonly fontWeight: number;
  readonly showLineNumbers: boolean;
  readonly focused: boolean;
  readonly themeId: string;
}

export interface PersistedEditorState {
  readonly options: Omit<EditorUIOptions, 'focused'>;
  readonly editors: readonly EditorState[];
}

export interface TerminalState {
  showHeader: boolean;
  type: string;
  accentVisible: boolean;
  shadow: string;
  background: string;
  textColor: string;
  showWatermark: boolean;
  showGlassReflection: boolean;
  opacity: number;
  alternativeTheme: boolean;
}

export type PersistedTerminalState = Pick<
  TerminalState,
  | 'showHeader'
  | 'type'
  | 'accentVisible'
  | 'shadow'
  | 'background'
  | 'textColor'
  | 'showWatermark'
  | 'showGlassReflection'
  | 'opacity'
  | 'alternativeTheme'
>;

export interface EditorFinalState {
  $workspaceId: string | null;
  $snippetId: string | null;
  $version: number;
  frame: PersistedFrameState;
  terminal: PersistedTerminalState;
  editor: PersistedEditorState;
}
