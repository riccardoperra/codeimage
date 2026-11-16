import type {parseSnapshotDocument} from '../../../packages/render/dist/index.mjs';
import type {
  AnimationHost,
  AnimationScenes,
  AnimationTiming,
  ComposedFrame,
  FrameHost,
} from '../../../apps/codeimage/src/render/contract';
import type {SnapshotInput} from '../../../packages/render/dist/index.mjs';
export interface Measured {
  width: number;
  height: number;
  transform: number[];
  children: Measured[];
  runs: {text: string; x: number; y: number; width: number}[];
}
export type Document = ReturnType<typeof parseSnapshotDocument>;
export interface Entry {
  composeFrame(
    document: Document,
    host: FrameHost,
    editorId?: string,
  ): Promise<ComposedFrame>;
  renderAnimationScenes(
    document: Document,
    timing: AnimationTiming,
    host: AnimationHost,
  ): Promise<AnimationScenes>;
}
export type Settings = AnimationTiming;
export type Args = {
  out: string;
  scale: string;
  case?: string[];
  shift?: string;
  encode: boolean;
};
export type Case = {name: string; input: SnapshotInput; identity?: boolean};
export const settings: Settings = {
  steps: [
    {editorId: 'a', holdMs: 500},
    {editorId: 'b', holdMs: 500},
  ],
  transitionMs: 900,
  easing: 'smooth',
  fps: 30,
};

export const frameTimeMs = (index: number, fps: number) =>
  Math.floor((index * 1000) / fps);

export type PairTab = {code: string; marks?: unknown; lineNumberStart?: number};
export type PairOverrides = {
  options?: Partial<SnapshotInput['editor']['options']>;
  terminal?: Record<string, unknown>;
  frame?: Record<string, unknown>;
  width?: number;
  languageId?: string;
  tabNames?: [string, string];
};

export type Pair = (
  from: PairTab,
  to: PairTab,
  overrides?: PairOverrides,
) => SnapshotInput;
