import {DragEventHandler} from '@thisbeyond/solid-dnd/dist/types/drag-drop-context';

export interface DndRect {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
}

export type DragEventParam = Parameters<DragEventHandler>[0];
