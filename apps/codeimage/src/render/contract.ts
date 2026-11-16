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

// A laid-out page in CSS pixels, with the text runs it draws.
export interface LayoutNode {
  width: number;
  height: number;
  children: LayoutNode[];
  runs: {text: string; width: number}[];
}

export interface AnimationHost extends FrameHost {
  layout(markup: FrameMarkup): Promise<LayoutNode>;
}

// The persisted Animate settings, as core/animation/model.ts names them. This
// file stays free of app imports, so the render package can read it.
export type AnimationEasing =
  | 'smooth'
  | 'snappy'
  | 'strong'
  | 'linear'
  | `cubic-bezier(${string})`;

export interface AnimationStep {
  editorId: string;
  holdMs: number;
  // The transition that leads into this step, when it has its own.
  transition?: {ms: number; easing: AnimationEasing};
}

// `fps` is the frame rate of the export, which a format can lower.
export interface AnimationTiming {
  steps: readonly [AnimationStep, ...AnimationStep[]];
  transitionMs: number;
  easing: AnimationEasing;
  fps: number;
  // What the window header shows in every scene. The static export's header
  // without it.
  header?: {mode: 'tab' | 'title' | 'tabs'; title: string};
}

export interface AnimationScene {
  html: string;
  durationMs: number;
  // A hold draws the static export of its step. A transition is two scenes,
  // and each one shows the tab of the step at its own end as active.
  kind: 'hold' | 'transition';
  // The step whose tab is active, an index into `steps`.
  step: number;
}

// The static export of one step, as composeFrame returns it for its tab.
export interface AnimationStepFrame extends ComposedFrame {
  // The frame size before rounding, which every scene of the step draws.
  exactSize: FrameSize;
}

export interface AnimationScenes {
  scenes: AnimationScene[];
  steps: AnimationStepFrame[];
  // One stylesheet for every scene.
  css: string[];
  images: ImageBytes[];
  fontFamily: string;
  // The largest frame over all steps, in whole CSS pixels.
  width: number;
  height: number;
}

export interface RenderEntry<Snapshot, Annotation> {
  SUPPORTED_FONT_IDS: string[];
  SUPPORTED_THEME_IDS: string[];
  // Renders the tab `editorId` as the active one. The first tab by default.
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
