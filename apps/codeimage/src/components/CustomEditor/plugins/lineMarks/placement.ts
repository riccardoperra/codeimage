import type {EditorView, Rect} from '@codemirror/view';
import {popupArea} from './popup';

export function createPlacement() {
  const slots = new WeakMap<EditorView, Map<number, HTMLElement>>();
  const offscreen = {left: -10000, right: -10000, top: -10000, bottom: -10000};
  const rectFor = (view: EditorView, line: number) => {
    const slot = slots.get(view)?.get(line);
    const rect = slot?.isConnected ? slot.getBoundingClientRect() : undefined;
    if (rect) return rect;
    return view.coordsAtPos(view.state.doc.line(line).from) ?? offscreen;
  };
  const lineShown = (view: EditorView, line: number) => {
    const from = view.state.doc.line(line).from;
    return view.visibleRanges.some(
      range => range.from <= from && from <= range.to,
    );
  };
  const besideLine = (view: EditorView, line: number, width: number): Rect => {
    const rect = rectFor(view, line);
    const middle = (rect.top + rect.bottom) / 2;
    const space = view.state.facet(popupArea)(view);
    if (
      !lineShown(view, line) ||
      middle < space.top ||
      middle > space.bottom ||
      rect.right < space.left ||
      rect.right - width > space.right
    )
      return offscreen;
    const top = Math.min(Math.max(middle - 12, space.top), space.bottom - 24);
    return {left: rect.right - width, right: rect.right, top, bottom: top};
  };
  return {slots, offscreen, rectFor, lineShown, besideLine};
}

export type LineMarkPlacement = ReturnType<typeof createPlacement>;
