import type {FontCacheOptions} from './fontCacheTypes';

import type {ImageSource} from '@takumi-rs/core';
import type {ProjectSnapshot, SnapshotDocument} from './document';

import type {FrameSize} from '../../../apps/codeimage/src/render/contract';

export interface AnnotatedCode {
  code: string;
  marks: NonNullable<ProjectSnapshot['editor']['editors'][number]['marks']>;
  count: number;
  sourceLines: number[];
}

export interface SnapshotFont {
  family: string;
  file: string;
  data: Uint8Array;
  weight?: number;
  unicodeRange?: [number, number][];
}

export interface SnapshotMarkup {
  document: SnapshotDocument;
  html: string;
  css: string[];
  naturalCss: string[];
  size: FrameSize;
  fonts: SnapshotFont[];
  fontFamilies: string[];
  images: ImageSource[];
}

export interface RendererOptions extends FontCacheOptions {
  codeFontFile?: string;
}

export interface AnimationFrame {
  width: number;
  height: number;
  rgba: Uint8Array;
}

export interface RawAnimation {
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  frames: AsyncIterable<AnimationFrame>;
}
