import type {ExportTargetId} from '@codeimage/config';

export interface FrameState {
  background: string | null;
  padding: number;
  radius: number;
  visible: boolean;
  opacity: number;
  autoWidth: boolean;
  scale: number;
  width: number;
  height: number;
  signature: {handle: string; position: 'bottom-left' | 'bottom-right'} | null;
  aspectRatio: string | null;
  exportTarget: ExportTargetId | null;
}

export type PersistedFrameState = Pick<
  FrameState,
  | 'background'
  | 'padding'
  | 'radius'
  | 'visible'
  | 'opacity'
  | 'signature'
  | 'aspectRatio'
  | 'exportTarget'
>;
