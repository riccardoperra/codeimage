import {Facet, type Extension} from '@codemirror/state';
import {tooltips, type EditorView, type Rect} from '@codemirror/view';

function popupSpace(area: HTMLElement | null | undefined) {
  return (view: EditorView): Rect => {
    const win = view.dom.ownerDocument.defaultView;
    const innerWidth = win?.innerWidth ?? 0;
    const innerHeight = win?.innerHeight ?? 0;
    const box = area?.isConnected
      ? area.getBoundingClientRect()
      : {left: 0, top: 0, right: innerWidth, bottom: innerHeight};
    return {
      left: Math.max(box.left, 0) + 8,
      top: Math.max(box.top, 0) + 8,
      right: Math.min(box.right, innerWidth) - 8,
      bottom: Math.min(box.bottom, innerHeight) - 8,
    };
  };
}

export const popupArea = Facet.define<
  (view: EditorView) => Rect,
  (view: EditorView) => Rect
>({
  combine: values => values[0] ?? popupSpace(undefined),
});

export function popupTooltips(parent: HTMLElement | undefined): Extension {
  const space = popupSpace(parent?.parentElement);
  return [
    tooltips({parent: parent ?? document.body, tooltipSpace: space}),
    popupArea.of(space),
  ];
}
