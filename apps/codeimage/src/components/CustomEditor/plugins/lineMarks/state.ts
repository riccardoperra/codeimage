import {spoilersByLine} from '@core/snapshot/spoilers';
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
import type {
  LineMark,
  TabMarks,
  ScriptLine,
  Spoiler,
} from '../../../../state/editor/model';

interface MarkState {
  decorations: DecorationSet;
  focused: DecorationSet;
  spoilers?: DecorationSet;
  script?: {steps: string[]; lines: DecorationSet};
}

const spoilerMark = Decoration.mark({
  class: 'cm-spoilerEdit',
  inclusiveStart: false,
  inclusiveEnd: false,
});

const openSpoilerMark = Decoration.mark({
  class: 'cm-spoilerEdit cm-spoilerOpen',
  inclusiveStart: false,
  inclusiveEnd: false,
});

function spoilerSet(doc: Text, marks: TabMarks): DecorationSet {
  return Decoration.set(
    (marks.spoilers ?? []).flatMap(({line, from, to}) => {
      if (line < 1 || line > doc.lines) return [];
      const {from: start, length} = doc.line(line);
      const [a, b] = [Math.min(from, length), Math.min(to, length)];
      return a < b ? [spoilerMark.range(start + a, start + b)] : [];
    }),
    true,
  );
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
    spoilers: value.spoilers?.map(changes),
    script: value.script && {
      ...value.script,
      lines: mapDecorations(value.script.lines, changes),
    },
  }),
});

export function marksValue(doc: Text, marks: TabMarks): MarkState {
  const byLine = new Map(marks.lines.map(mark => [mark.line, mark.kind]));
  return {
    spoilers: spoilerSet(doc, marks),
    ...(marks.script
      ? {
          script: {
            steps: [...marks.script.steps],
            lines: Decoration.set(
              Array.from({length: doc.lines}, (_, index) =>
                Decoration.line({
                  script: marks.script!.lines.find(
                    line => line.line === index + 1,
                  ) ?? {line: index + 1},
                }).range(doc.line(index + 1).from),
              ),
            ),
          },
        }
      : {}),
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

class GutterClass extends GutterMarker {
  constructor(readonly elementClass: string) {
    super();
  }
}

const dimmedLine = new GutterClass('cm-lineMarkDim');
const gutterMarks = {
  added: new GutterClass('cm-lineMark-added'),
  removed: new GutterClass('cm-lineMark-removed'),
  highlight: new GutterClass('cm-lineMark-highlight'),
};

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
        spoilers: value.spoilers?.map(tr.changes),
        script: value.script && {
          ...value.script,
          lines: map(value.script.lines),
        },
      };
    }
    if (tr.docChanged && value.script) {
      const byLine = new Map<number, ScriptLine>();
      for (let cursor = value.script.lines.iter(); cursor.value; cursor.next())
        byLine.set(
          tr.state.doc.lineAt(cursor.from).number,
          cursor.value.spec.script,
        );
      const ranges = [];
      let previous: ScriptLine | undefined;
      for (let line = 1; line <= tr.state.doc.lines; line++) {
        let rule = byLine.get(line);
        if (!rule) {
          const neighbour =
            previous ?? [...byLine].find(([number]) => number > line)?.[1];
          rule = {
            line,
            ...(neighbour?.enter === undefined ? {} : {enter: neighbour.enter}),
            ...(neighbour?.leave === undefined ? {} : {leave: neighbour.leave}),
          };
        }
        previous = rule;
        ranges.push(
          Decoration.line({script: {...rule, line}}).range(
            tr.state.doc.line(line).from,
          ),
        );
      }
      value = {
        ...value,
        script: {...value.script, lines: Decoration.set(ranges)},
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
    EditorView.decorations.compute([field, 'selection'], state => {
      const spoilers = state.field(field).spoilers;
      if (!spoilers?.size) return Decoration.none;
      const ranges = [];
      for (let cursor = spoilers.iter(); cursor.value; cursor.next()) {
        const {from, to} = cursor;
        const open = state.selection.ranges.some(
          range => range.from <= to && range.to >= from,
        );
        ranges.push((open ? openSpoilerMark : spoilerMark).range(from, to));
      }
      return Decoration.set(ranges, true);
    }),
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
      const markers = [];
      for (let cursor = value.decorations.iter(); cursor.value; cursor.next())
        markers.push(
          gutterMarks[
            cursor.value.spec.attributes['data-mark'] as LineMark['kind']
          ].range(cursor.from),
        );
      if (value.focused.size) {
        const highlighted = new Set<number>();
        for (let cursor = value.focused.iter(); cursor.value; cursor.next())
          highlighted.add(cursor.from);
        for (let line = 1; line <= state.doc.lines; line++) {
          const from = state.doc.line(line).from;
          if (!highlighted.has(from)) markers.push(dimmedLine.range(from));
        }
      }
      return RangeSet.of(markers, true);
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
  const script = value.script;
  const lines: ScriptLine[] = [];
  if (script)
    for (let cursor = script.lines.iter(); cursor.value; cursor.next()) {
      const rule: ScriptLine = cursor.value.spec.script;
      if (
        rule.enter !== undefined ||
        rule.leave !== undefined ||
        rule.focus?.length
      )
        lines.push({...rule, line: state.doc.lineAt(cursor.from).number});
    }
  const spoilers: Spoiler[] = [];
  value.spoilers?.between(0, state.doc.length, (from, to) => {
    for (let pos = from; pos < to;) {
      const line = state.doc.lineAt(pos);
      const end = Math.min(to, line.to);
      if (end > pos)
        spoilers.push({
          line: line.number,
          from: pos - line.from,
          to: end - line.from,
        });
      pos = line.to + 1;
    }
  });
  return {
    lines: [...byLine.values()],
    focusedLines,
    ...(spoilers.length
      ? {
          spoilers: [...spoilersByLine(spoilers)].flatMap(([line, ranges]) =>
            ranges.map(([from, to]) => ({line, from, to})),
          ),
        }
      : {}),
    ...(script ? {script: {steps: [...script.steps], lines}} : {}),
  };
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
      Transaction.userEvent.of('input.line-marks'),
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
    ...marks,
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
    ...marks,
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

function selectionRanges(state: EditorView['state']) {
  return state.selection.ranges.filter(range => !range.empty);
}

export function hasSpoiler(state: EditorView['state']) {
  const spoilers = state.field(lineMarksField).spoilers;
  const ranges = selectionRanges(state);
  if (!spoilers || !ranges.length) return false;
  return ranges.every(range => {
    let covered = range.from;
    spoilers.between(range.from, range.to, (from, to) => {
      if (from <= covered) covered = Math.max(covered, to);
    });
    return covered >= range.to;
  });
}

export function toggleSpoiler(view: EditorView) {
  if (view.state.readOnly) return false;
  const ranges = selectionRanges(view.state);
  if (!ranges.length) return false;
  const value = view.state.field(lineMarksField);
  let pieces: [number, number][] = [];
  value.spoilers?.between(0, view.state.doc.length, (from, to) => {
    pieces.push([from, to]);
  });
  if (hasSpoiler(view.state)) {
    for (const range of ranges)
      pieces = pieces.flatMap(([from, to]): [number, number][] =>
        to <= range.from || from >= range.to
          ? [[from, to]]
          : [
              ...(from < range.from
                ? [[from, range.from] as [number, number]]
                : []),
              ...(to > range.to ? [[range.to, to] as [number, number]] : []),
            ],
      );
  } else {
    pieces.push(...ranges.map(({from, to}): [number, number] => [from, to]));
  }
  const spoilers = Decoration.set(
    pieces.map(([from, to]) => spoilerMark.range(from, to)),
    true,
  );
  view.dispatch({
    effects: replaceMarks.of({...value, spoilers}),
    annotations: [
      isolateHistory.of('full'),
      Transaction.userEvent.of('input.line-marks'),
    ],
  });
  return true;
}
