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
  watermarkFrame: {painted: boolean; inset: number};
}

export interface LayoutNode {
  width: number;
  height: number;
  children: LayoutNode[];
  runs: {text: string; width: number}[];
}

export interface AnimationHost extends FrameHost {
  layout(markup: FrameMarkup): Promise<LayoutNode>;
}

export type AnimationEasing =
  | 'smooth'
  | 'snappy'
  | 'strong'
  | 'linear'
  | `cubic-bezier(${string})`;

export type AnimationStepView =
  | {kind: 'tab'}
  | {kind: 'diff'; side: 'before' | 'after'}
  | {kind: 'script'; step: number};

export interface AnimationStep {
  editorId: string;
  view?: AnimationStepView;
  holdMs: number;
  transition?: {ms: number; easing: AnimationEasing};
}

export interface AnimationTiming {
  steps: readonly [AnimationStep, ...AnimationStep[]];
  transitionMs: number;
  easing: AnimationEasing;
  fps: number;
  header?: {mode: 'tab' | 'title' | 'tabs'; title: string};
}

export interface AnimationScene {
  html: string;
  durationMs: number;
  kind: 'hold' | 'transition';
  step: number;
}

export interface AnimationStepFrame extends ComposedFrame {
  exactSize: FrameSize;
}

export interface AnimationScenes {
  scenes: AnimationScene[];
  steps: AnimationStepFrame[];
  css: string[];
  images: ImageBytes[];
  fontFamily: string;
  width: number;
  height: number;
}

export interface RenderEntry<Snapshot, Annotation> {
  SUPPORTED_FONT_IDS: string[];
  SUPPORTED_THEME_IDS: string[];
  composeFrame(
    snapshot: Snapshot,
    host: FrameHost,
    editorId?: string,
  ): Promise<ComposedFrame>;
  renderAnimationScenes(
    snapshot: Snapshot,
    timing: AnimationTiming,
    host: AnimationHost,
  ): Promise<AnimationScenes>;
  annotateCode(
    code: string,
    languageId: string,
    tabName: string,
  ): Promise<Annotation>;
}
