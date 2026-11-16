import {StateField, type EditorState} from '@codemirror/state';
import {showTooltip, type EditorView, type Tooltip} from '@codemirror/view';
import {Marker} from './marker';
import {gutterState, markAt} from './gutter-state';
import {lineMarksField} from './state';

export function createMarkerField(
  environment: ConstructorParameters<typeof Marker>[1],
) {
  const markersFor = (state: EditorState) => {
    const ui = state.field(gutterState);
    const cursor = state.doc.lineAt(state.selection.main.head).number;
    return [...new Set([cursor, ui.hovered, ui.focused, ui.open?.line])]
      .filter(
        (line): line is number =>
          line !== null &&
          line !== undefined &&
          line >= 1 &&
          line <= state.doc.lines,
      )
      .map(line => {
        const mark = markAt(state, line);
        return new Marker(
          {
            line,
            kind: mark.kind,
            focused: mark.focused,
            hovered: line === ui.hovered,
            active: line === ui.active,
            keyboardFocus: line === ui.focused,
            open: line === ui.open?.line,
            news: ui.news && line === cursor,
          },
          environment,
        );
      });
  };
  const markerTooltips = StateField.define<{
    markers: Marker[];
    tooltips: Tooltip[];
  }>({
    create: state => {
      const markers = markersFor(state);
      return {
        markers,
        tooltips: state.readOnly
          ? []
          : markers.map(marker => ({
              pos: state.doc.line(marker.line).from,
              strictSide: true,
              clip: false,
              create: view => marker.control(view),
            })),
      };
    },
    update(value, tr) {
      if (tr.state.readOnly) return {markers: [], tooltips: []};
      if (
        !tr.docChanged &&
        !tr.selection &&
        !tr.startState.readOnly &&
        tr.startState.field(gutterState, false) ===
          tr.state.field(gutterState) &&
        tr.startState.field(lineMarksField, false) ===
          tr.state.field(lineMarksField)
      )
        return value;
      const markers = markersFor(tr.state);
      const tooltips = markers.map(marker => {
        const index = value.markers.findIndex(previous => marker.eq(previous));
        return index < 0 || tr.docChanged
          ? {
              pos: tr.state.doc.line(marker.line).from,
              strictSide: true,
              clip: false,
              create: (view: EditorView) => marker.control(view),
            }
          : value.tooltips[index];
      });
      return {markers, tooltips};
    },
    provide: field =>
      showTooltip.computeN([field], state => state.field(field).tooltips),
  });
  return markerTooltips;
}
