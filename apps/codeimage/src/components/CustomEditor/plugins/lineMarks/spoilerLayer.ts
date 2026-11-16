import {spoilerDotsHtml} from '@core/snapshot/spoilers';
import {EditorSelection} from '@codemirror/state';
import {
  layer,
  RectangleMarker,
  type EditorView,
  type LayerMarker,
} from '@codemirror/view';
import {lineMarksField} from './state';

class SpoilerDots implements LayerMarker {
  constructor(
    readonly left: number,
    readonly top: number,
    readonly width: number,
    readonly height: number,
    readonly seed: string,
    readonly columns: number,
    readonly open: boolean,
  ) {}

  eq(other: LayerMarker): boolean {
    return (
      other instanceof SpoilerDots &&
      other.left === this.left &&
      other.top === this.top &&
      other.width === this.width &&
      other.height === this.height &&
      other.seed === this.seed &&
      other.columns === this.columns &&
      other.open === this.open
    );
  }

  draw() {
    const element = document.createElement('div');
    element.innerHTML = spoilerDotsHtml(this.columns, this.seed);
    const dots = element.firstElementChild as HTMLElement;
    Object.assign(dots.style, {
      left: `${this.left}px`,
      top: `${this.top}px`,
      width: `${this.width}px`,
      height: `${this.height}px`,
    });
    if (this.open) dots.dataset.open = '';
    return dots;
  }
}

function spoilerMarkers(view: EditorView): LayerMarker[] {
  const spoilers = view.state.field(lineMarksField).spoilers;
  if (!spoilers?.size) return [];
  const markers: LayerMarker[] = [];
  const {doc, selection} = view.state;
  for (let cursor = spoilers.iter(); cursor.value; cursor.next()) {
    const open = selection.ranges.some(
      range => range.from <= cursor.to && range.to >= cursor.from,
    );
    for (let pos = cursor.from; pos < cursor.to;) {
      const line = doc.lineAt(pos);
      const end = Math.min(cursor.to, line.to);
      if (end > pos) {
        const rects = RectangleMarker.forRange(
          view,
          '',
          EditorSelection.range(pos, end),
        );
        for (const rect of rects)
          markers.push(
            new SpoilerDots(
              rect.left,
              rect.top,
              rect.width ?? 0,
              rect.height,
              `${line.number - 1}:${pos - line.from}`,
              end - pos,
              open,
            ),
          );
      }
      pos = line.to + 1;
    }
  }
  return markers;
}

export const spoilerLayer = layer({
  above: true,
  class: 'cm-spoilerLayer',
  markers: spoilerMarkers,
  update: update =>
    update.docChanged ||
    update.selectionSet ||
    update.geometryChanged ||
    update.viewportChanged ||
    update.startState.field(lineMarksField) !==
      update.state.field(lineMarksField),
});
