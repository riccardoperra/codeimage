import type {ProjectEditorPersistedState} from '../state/editor/model';
import type {PersistedFrameState} from '../state/frame/model';

export type RenderSnapshot = Omit<ProjectEditorPersistedState, 'frame'> & {
  width?: number;
  frame: Omit<PersistedFrameState, 'exportTarget' | 'aspectRatio'> &
    Partial<Pick<PersistedFrameState, 'exportTarget' | 'aspectRatio'>>;
};
export interface ImageBytes {
  readonly src: string;
  readonly data: ArrayBuffer;
}

export interface FrameSize {
  width: number;
  height: number;
}

export interface FrameMarkup {
  html: string;
  css: string[];
  images: ImageBytes[];
  fontFamily: string;
}

export interface FrameHost {
  measure(markup: FrameMarkup): Promise<FrameSize>;
  pixels(markup: FrameMarkup, size: number): Promise<Uint8Array>;
}

export interface ComposedFrame extends FrameMarkup {
  size: FrameSize;
  browserCss: string[];
}

export interface RenderEntry {
  SUPPORTED_FONT_IDS: string[];
  SUPPORTED_THEME_IDS: string[];
  composeFrame(
    snapshot: RenderSnapshot,
    host: FrameHost,
  ): Promise<ComposedFrame>;
  annotateCode(
    code: string,
    languageId: string,
    tabName: string,
  ): Promise<{
    code: string;
    marks: NonNullable<
      ProjectEditorPersistedState['editor']['editors'][number]['marks']
    >;
    count: number;
    sourceLines: number[];
  }>;
}
