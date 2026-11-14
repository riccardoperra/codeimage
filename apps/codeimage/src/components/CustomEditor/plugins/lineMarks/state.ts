import {invertedEffects, isolateHistory} from '@codemirror/commands';
import type {ChangeDesc, Extension, Text} from '@codemirror/state';
import {
  MapMode,
  RangeSet,
  StateEffect,
  StateField,
  Transaction,
} from '@codemirror/state';
import type {DecorationSet} from '@codemirror/view';
import {
  Decoration,
  EditorView,
  GutterMarker,
  gutterLineClass,
} from '@codemirror/view';
import type {LineMark, TabMarks} from '../../../../state/editor/model';

interface MarkState {
  decorations: DecorationSet;
  focused: DecorationSet;
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
    focused: mapDecorations(value.focused, changes),
  }),
});

export function marksValue(doc: Text, marks: TabMarks): MarkState {
  const byLine = new Map(marks.lines.map(mark => [mark.line, mark.kind]));
  return {
    focused: Decoration.set(
      [...new Set(marks.focusedLines)]
        .filter(line => line >= 1 && line <= doc.lines)
        .sort((a, b) => a - b)
        .map(line =>
          Decoration.line({attributes: {'data-focused': 'true'}}).range(
            doc.line(line).from,
          ),
        ),
    ),
    decorations: Decoration.set(
      [...byLine]
        .filter(([line]) => line >= 1 && line <= doc.lines)
        .sort(([a], [b]) => a - b)
        .map(([line, kind]) => decorations[kind].range(doc.line(line).from)),
    ),
  };
}

const dimmedLine = new (class extends GutterMarker {
  elementClass = 'cm-lineMarkDim';
})();

export const lineMarksField = StateField.define<MarkState>({
  create: () => ({decorations: Decoration.none, focused: Decoration.none}),
  update(value, tr) {
    if (tr.docChanged) {
      const map = (decorations: DecorationSet) => {
        const mapped = mapDecorations(
          decorations,
          tr.changes,
          tr.startState.doc,
        );
        const normalized = [];
        let previous = -1;
        for (let cursor = mapped.iter(); cursor.value; cursor.next()) {
          const from = tr.state.doc.lineAt(cursor.from).from;
          // Joining lines keeps one mark of each independent kind.
          if (from === previous) continue;
          normalized.push(cursor.value.range(from));
          previous = from;
        }
        return Decoration.set(normalized, true);
      };
      value = {
        decorations: map(value.decorations),
        focused: map(value.focused),
      };
    }
    for (const effect of tr.effects) {
      if (effect.is(replaceMarks)) value = effect.value;
    }
    return value;
  },
  provide: field => [
    EditorView.decorations.from(field, value => value.decorations),
    EditorView.decorations.from(field, value => value.focused),
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
        'data-line-focus': String(value.focused.size > 0),
        'data-line-diff': String(diff),
      };
    }),
    gutterLineClass.compute([field], state => {
      const value = state.field(field);
      if (!value.focused.size) return RangeSet.empty;
      const highlighted = new Set<number>();
      for (let cursor = value.focused.iter(); cursor.value; cursor.next())
        highlighted.add(cursor.from);
      const markers = [];
      for (let line = 1; line <= state.doc.lines; line++) {
        const from = state.doc.line(line).from;
        if (!highlighted.has(from)) markers.push(dimmedLine.range(from));
      }
      return RangeSet.of(markers);
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
  const focusedLines: number[] = [];
  value.focused.between(0, state.doc.length, from => {
    focusedLines.push(state.doc.lineAt(from).number);
  });
  return {lines: [...byLine.values()], focusedLines};
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

export type MarkKind = LineMark['kind'] | 'focus';

export function hasMark(marks: TabMarks, line: number, kind: MarkKind) {
  return kind === 'focus'
    ? marks.focusedLines.includes(line)
    : marks.lines.some(mark => mark.line === line && mark.kind === kind);
}

export function markLines(
  view: EditorView,
  lines: number[],
  kind: MarkKind | null,
) {
  if (view.state.readOnly) return false;
  const marks = readMarks(view.state);
  const focused = new Set(marks.focusedLines);
  const updated = new Map(marks.lines.map(mark => [mark.line, mark]));
  for (const line of lines) {
    if (kind === 'focus') focused.add(line);
    else if (kind) updated.set(line, {line, kind});
    else {
      updated.delete(line);
      focused.delete(line);
    }
  }
  setLineMarks(view, {
    focusedLines: [...focused],
    lines: [...updated.values()],
  });
  return true;
}

export function unmarkLines(view: EditorView, lines: number[], kind: MarkKind) {
  if (view.state.readOnly) return false;
  const marks = readMarks(view.state);
  const removed = new Set(lines);
  setLineMarks(view, {
    lines: marks.lines.filter(
      mark => !removed.has(mark.line) || mark.kind !== kind,
    ),
    focusedLines:
      kind === 'focus'
        ? marks.focusedLines.filter(line => !removed.has(line))
        : marks.focusedLines,
  });
  return true;
}

/** Removes `kind` when every line already has it, otherwise adds it. */
export function toggleMark(
  view: EditorView,
  lines: number[],
  kind: MarkKind | null,
) {
  const marks = readMarks(view.state);
  return kind && lines.every(line => hasMark(marks, line, kind))
    ? unmarkLines(view, lines, kind)
    : markLines(view, lines, kind);
}

export const lineMarksHistory: Extension = invertedEffects.of(tr => {
  if (tr.docChanged || tr.effects.some(effect => effect.is(replaceMarks))) {
    return [replaceMarks.of(tr.startState.field(lineMarksField))];
  }
  return [];
});
