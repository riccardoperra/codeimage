import {invertedEffects, isolateHistory} from '@codemirror/commands';
import type {ChangeDesc, Extension, Text} from '@codemirror/state';
import {MapMode, StateEffect, StateField, Transaction} from '@codemirror/state';
import type {DecorationSet} from '@codemirror/view';
import {Decoration, EditorView} from '@codemirror/view';
import type {LineMark, TabMarks} from '../../../../state/editor/model';

interface MarkState {
  decorations: DecorationSet;
  focus: boolean;
}

const decorations = {
  added: Decoration.line({attributes: {'data-mark': 'added'}}),
  removed: Decoration.line({attributes: {'data-mark': 'removed'}}),
  highlight: Decoration.line({attributes: {'data-mark': 'highlight'}}),
};

function mapDecorations(
  value: DecorationSet,
  changes: ChangeDesc,
  before?: Text,
): DecorationSet {
  const mapped = [];
  for (let cursor = value.iter(); cursor.value; cursor.next()) {
    let deleted = false;
    if (before) {
      const line = before.lineAt(cursor.from);
      changes.iterChangedRanges((from, to) => {
        if (from === 0 && to === before.length && from < to) deleted = true;
        if (line.number < before.lines && from <= line.from && to > line.to)
          deleted = true;
      });
    }
    if (deleted) continue;
    const from = changes.mapPos(cursor.from, 1, MapMode.TrackDel);
    if (from !== null) mapped.push(cursor.value.range(from));
  }
  return Decoration.set(mapped, true);
}

export const replaceMarks = StateEffect.define<MarkState>({
  map: (value, changes) => ({
    ...value,
    decorations: mapDecorations(value.decorations, changes),
  }),
});

export function marksValue(doc: Text, marks: TabMarks): MarkState {
  const byLine = new Map(marks.lines.map(mark => [mark.line, mark.kind]));
  return {
    focus: marks.focus,
    decorations: Decoration.set(
      [...byLine]
        .filter(([line]) => line >= 1 && line <= doc.lines)
        .sort(([a], [b]) => a - b)
        .map(([line, kind]) => decorations[kind].range(doc.line(line).from)),
    ),
  };
}

export const lineMarksField = StateField.define<MarkState>({
  create: () => ({decorations: Decoration.none, focus: false}),
  update(value, tr) {
    if (tr.docChanged) {
      const mapped = mapDecorations(
        value.decorations,
        tr.changes,
        tr.startState.doc,
      );
      const normalized = [];
      let previous = -1;
      for (let cursor = mapped.iter(); cursor.value; cursor.next()) {
        const from = tr.state.doc.lineAt(cursor.from).from;
        // Joining two marked lines keeps the mark of the line that remains.
        if (from === previous) continue;
        normalized.push(cursor.value.range(from));
        previous = from;
      }
      value = {...value, decorations: Decoration.set(normalized, true)};
    }
    for (const effect of tr.effects) {
      if (effect.is(replaceMarks)) value = effect.value;
    }
    return value;
  },
  provide: field => [
    EditorView.decorations.from(field, value => value.decorations),
    EditorView.editorAttributes.from(field, value => {
      let diff = false;
      for (let cursor = value.decorations.iter(); cursor.value; cursor.next()) {
        if (cursor.value.spec.attributes['data-mark'] !== 'highlight') {
          diff = true;
          break;
        }
      }
      return {
        'data-line-marks': 'true',
        'data-line-focus': String(value.focus),
        'data-line-diff': String(diff),
      };
    }),
  ],
});

export function readMarks(state: EditorView['state']): TabMarks {
  const value = state.field(lineMarksField);
  const byLine = new Map<number, LineMark>();
  value.decorations.between(0, state.doc.length, (from, _to, decoration) => {
    const kind: LineMark['kind'] = decoration.spec.attributes['data-mark'];
    const line = state.doc.lineAt(from).number;
    byLine.set(line, {line, kind});
  });
  return {lines: [...byLine.values()], focus: value.focus};
}

export function setLineMarks(
  view: EditorView,
  marks: TabMarks,
  addToHistory = true,
) {
  view.dispatch({
    effects: replaceMarks.of(marksValue(view.state.doc, marks)),
    annotations: [
      Transaction.addToHistory.of(addToHistory),
      isolateHistory.of('full'),
    ],
  });
}

export function markLines(
  view: EditorView,
  lines: number[],
  kind: LineMark['kind'] | null,
) {
  if (view.state.readOnly) return false;
  const marks = readMarks(view.state);
  const updated = new Map(marks.lines.map(mark => [mark.line, mark]));
  for (const line of lines) {
    if (kind) updated.set(line, {line, kind});
    else updated.delete(line);
  }
  setLineMarks(view, {...marks, lines: [...updated.values()]});
  return true;
}

export const lineMarksHistory: Extension = invertedEffects.of(tr => {
  if (tr.docChanged || tr.effects.some(effect => effect.is(replaceMarks))) {
    return [replaceMarks.of(tr.startState.field(lineMarksField))];
  }
  return [];
});
