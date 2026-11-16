import {RangeSet, StateEffect, StateField} from '@codemirror/state';
import {
  Decoration,
  EditorView,
  GutterMarker,
  gutterLineClass,
  ViewPlugin,
  type BlockInfo,
  type DecorationSet,
} from '@codemirror/view';
import {hasMark, markLines, readMarks} from './state';

class PreviewClass extends GutterMarker {
  constructor(readonly elementClass: string) {
    super();
  }
}

const previewGutter = {
  highlight: new PreviewClass('cm-lineMarkPreview-highlight'),
  clear: new PreviewClass('cm-lineMarkPreview-clear'),
};

type GutterPreview = {from: number; to: number; kind: 'highlight' | null};

const setGutterPreview = StateEffect.define<GutterPreview | null>();

export const gutterPreviewField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    let decorations = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (!effect.is(setGutterPreview)) continue;
      const preview = effect.value;
      if (!preview) {
        decorations = Decoration.none;
        continue;
      }
      const decoration = Decoration.line({
        attributes: {'data-mark-preview': preview.kind ?? 'clear'},
      });
      const ranges = [];
      for (let line = preview.from; line <= preview.to; line++)
        ranges.push(decoration.range(tr.state.doc.line(line).from));
      decorations = Decoration.set(ranges);
    }
    return decorations;
  },
  provide: field => [
    EditorView.decorations.from(field),
    gutterLineClass.compute([field], state => {
      const markers = [];
      for (
        let cursor = state.field(field).iter();
        cursor.value;
        cursor.next()
      ) {
        const marker =
          cursor.value.spec.attributes['data-mark-preview'] === 'highlight'
            ? previewGutter.highlight
            : previewGutter.clear;
        markers.push(marker.range(cursor.from));
      }
      return RangeSet.of(markers);
    }),
  ],
});

export function lineAtHeight(view: EditorView, y: number): number {
  const height = Math.max(
    0,
    Math.min((y - view.documentTop) / view.scaleY, view.contentHeight),
  );
  const block = view.lineBlockAtHeight(height);
  return view.state.doc.lineAt(Math.min(block.from, view.state.doc.length))
    .number;
}

export const gutterDrag = ViewPlugin.define(
  view => {
    let drag: {start: number; end: number; kind: 'highlight' | null} | null =
      null;
    const doc = view.dom.ownerDocument;
    const win = doc.defaultView;
    const preview = () => {
      if (!drag) return;
      view.dispatch({
        effects: setGutterPreview.of({
          from: Math.min(drag.start, drag.end),
          to: Math.max(drag.start, drag.end),
          kind: drag.kind,
        }),
      });
    };
    const release = () => {
      if (!drag) return;
      const {start, end, kind} = drag;
      drag = null;
      view.dispatch({effects: setGutterPreview.of(null)});
      markLines(
        view,
        Array.from(
          {length: Math.abs(end - start) + 1},
          (_, i) => Math.min(start, end) + i,
        ),
        kind,
      );
      view.focus();
    };
    const cancel = () => {
      if (!drag) return;
      drag = null;
      view.dispatch({effects: setGutterPreview.of(null)});
    };
    doc.addEventListener('pointerup', release);
    doc.addEventListener('pointercancel', cancel);
    win?.addEventListener('blur', release);
    return {
      start(line: BlockInfo, event: PointerEvent) {
        const start = view.state.doc.lineAt(line.from).number;
        drag = {
          start,
          end: start,
          kind: hasMark(readMarks(view.state), start, 'highlight')
            ? null
            : 'highlight',
        };
        view.contentDOM.setPointerCapture(event.pointerId);
        preview();
      },
      move(event: PointerEvent) {
        if (!drag) return;
        const next = lineAtHeight(view, event.clientY);
        if (next === drag.end) return;
        drag.end = next;
        preview();
      },
      destroy() {
        doc.removeEventListener('pointerup', release);
        doc.removeEventListener('pointercancel', cancel);
        win?.removeEventListener('blur', release);
      },
    };
  },
  {
    eventHandlers: {
      pointermove(event) {
        this.move(event);
      },
    },
  },
);

export function gutterMarkPointerDown(
  view: EditorView,
  line: BlockInfo,
  event: Event,
): boolean {
  if (
    !(event instanceof PointerEvent) ||
    event.button !== 0 ||
    view.state.readOnly
  )
    return false;
  const drag = view.plugin(gutterDrag);
  if (!drag) return false;
  event.preventDefault();
  drag.start(line, event);
  return true;
}
