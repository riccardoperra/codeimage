import {PersistedFrameState} from '@codeimage/store/frame/model';

export interface EditorUIOptions {
  fontId: string;
  fontWeight: number;
  showLineNumbers: boolean;
  focused: boolean;
  themeId: string;
}

export interface TabState {
  tabName: string | null;
  tabIcon?: string;
}

export interface EditorState {
  id: string;
  code: string;
  tab: TabState;
  languageId: string;
}

export interface EditorUIOptions {
  fontId: string;
  fontWeight: number;
  showLineNumbers: boolean;
  focused: boolean;
  themeId: string;
  enableLigatures: boolean;
}

export interface PersistedEditorState {
  readonly options: Omit<EditorUIOptions, 'focused'>;
  readonly editors: {
    id: string;
    code: string;
    tabName: string;
    languageId: string;
  }[];
}

export interface TerminalState {
  showHeader: boolean;
  type: string;
  accentVisible: boolean;
  shadow: string | null;
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

export interface ProjectEditorPersistedState {
  $snippetId: string | null;
  $version: string;
  frame: PersistedFrameState;
  terminal: PersistedTerminalState;
  editor: PersistedEditorState;
}
