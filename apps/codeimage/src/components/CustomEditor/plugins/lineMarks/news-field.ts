import {StateField} from '@codemirror/state';
import {showTooltip, type EditorView, type Tooltip} from '@codemirror/view';
import {gutterState} from './gutter-state';
import type {LineMarkPlacement} from './placement';

export function createNewsField(
  placement: LineMarkPlacement,
  mountNews?: (host: HTMLElement) => () => void,
) {
  const {besideLine} = placement;
  const createNews = (view: EditorView) => {
    const dom = view.dom.ownerDocument.createElement('div');
    dom.className = 'cm-lineMarkNews';
    const dispose = mountNews?.(dom);
    return {
      dom,
      overlap: true,
      getCoords: () =>
        besideLine(
          view,
          view.state.doc.lineAt(view.state.selection.main.head).number,
          46,
        ),
      destroy: () => dispose?.(),
    };
  };
  const newsField = StateField.define<Tooltip | null>({
    create: () => null,
    update(value, tr) {
      if (!tr.state.field(gutterState).news || tr.state.readOnly || !mountNews)
        return null;
      const pos = tr.state.doc.lineAt(tr.state.selection.main.head).from;
      return value?.pos === pos
        ? value
        : {pos, strictSide: true, clip: false, create: createNews};
    },
    provide: field => showTooltip.from(field),
  });
  return newsField;
}
