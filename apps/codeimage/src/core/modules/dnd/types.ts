import type { DragEventHandler } from "@thisbeyond/solid-dnd";

export interface DndRect {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
}

export type DragEventParam = Parameters<DragEventHandler>[0];
