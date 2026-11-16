import {EditorView, ViewPlugin, type BlockInfo} from '@codemirror/view';
import {lineAtHeight} from './gutter-drag';
import {gutterAction, gutterState} from './gutter-state';

export function gutterMarkHover(
  view: EditorView,
  _line: BlockInfo,
  event: Event,
): boolean {
  if (!(event instanceof PointerEvent) || event.pointerType !== 'mouse')
    return false;
  const ui = view.state.field(gutterState);
  if (ui.open) return false;
  const line = lineAtHeight(view, event.clientY);
  if (line !== ui.hovered)
    view.dispatch({effects: gutterAction.of({kind: 'hover', line})});
  return false;
}

export function gutterMarkLeave(
  view: EditorView,
  _line: BlockInfo,
  event: Event,
): boolean {
  if (!(event instanceof PointerEvent)) return false;
  const next = event.relatedTarget;
  if (next instanceof Node && view.dom.contains(next)) return false;
  if (
    next instanceof Element &&
    next.closest('.cm-lineMarkControl, .cm-lineMarkMenu')
  )
    return false;
  const ui = view.state.field(gutterState);
  if (!ui.open && ui.hovered !== null)
    view.dispatch({effects: gutterAction.of({kind: 'hover', line: null})});
  return false;
}

export function gutterPointer() {
  return [
    EditorView.domEventHandlers({
      pointermove(event, view) {
        const ui = view.state.field(gutterState);
        if (ui.open || event.pointerType !== 'mouse') return;
        const line = lineAtHeight(view, event.clientY);
        if (line !== ui.hovered)
          view.dispatch({effects: gutterAction.of({kind: 'hover', line})});
      },
      pointerleave(event, view) {
        if (
          event.relatedTarget instanceof Element &&
          event.relatedTarget.closest('.cm-lineMarkControl, .cm-lineMarkMenu')
        )
          return;
        const ui = view.state.field(gutterState);
        if (!ui.open && ui.hovered !== null)
          view.dispatch({
            effects: gutterAction.of({kind: 'hover', line: null}),
          });
      },
    }),
    ViewPlugin.define(view => {
      const doc = view.dom.ownerDocument;
      let alive = true;
      const blur = () =>
        queueMicrotask(() => {
          if (!alive) return;
          const target = doc.activeElement;
          if (
            target instanceof Element &&
            target.closest('.cm-lineMarkControl, .cm-lineMarkMenu')
          )
            return;
          if (view.state.field(gutterState).focused !== null)
            view.dispatch({
              effects: gutterAction.of({kind: 'focus', line: null}),
            });
        });
      doc.addEventListener('focusin', blur);
      return {
        destroy: () => {
          alive = false;
          doc.removeEventListener('focusin', blur);
        },
      };
    }),
  ];
}
