import type {Mp4Config} from './encode';
import type {RasterizeResources} from '../rasterize/takumi';

export type AnimationScene = {html: string; css: string; durationMs: number};
export type AnimationExport = {
  scenes: AnimationScene[];
  resources: RasterizeResources;
  css: string;
  config: Mp4Config;
  pixelRatio: number;
  background: string;
};
export type AnimationRequest =
  | {kind: 'warm'; config: Mp4Config}
  | {kind: 'export'; job: AnimationExport}
  | {kind: 'cancel'};
export type AnimationEvent =
  | {kind: 'warmed'}
  | {kind: 'progress'; done: number; total: number}
  | {
      kind: 'done';
      buffer: ArrayBuffer;
      frames: number;
      durationMs: number;
      renderMs: number;
      elapsedMs: number;
    }
  | {kind: 'failed'; cause: string}
  | {kind: 'cancelled'};
