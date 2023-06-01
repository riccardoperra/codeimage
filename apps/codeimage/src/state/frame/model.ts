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
  aspectRatio: string | null;
}

export type PersistedFrameState = Pick<
  FrameState,
  'background' | 'padding' | 'radius' | 'visible' | 'opacity'
>;
