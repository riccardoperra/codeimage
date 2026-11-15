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
  offline?: boolean;
  measure(markup: FrameMarkup): Promise<FrameSize>;
  pixels(markup: FrameMarkup, size: number): Promise<Uint8Array>;
}

export interface ComposedFrame extends FrameMarkup {
  size: FrameSize;
  browserCss: string[];
}

export interface RenderEntry<Snapshot, Annotation> {
  SUPPORTED_FONT_IDS: string[];
  SUPPORTED_THEME_IDS: string[];
  composeFrame(snapshot: Snapshot, host: FrameHost): Promise<ComposedFrame>;
  annotateCode(
    code: string,
    languageId: string,
    tabName: string,
  ): Promise<Annotation>;
}
