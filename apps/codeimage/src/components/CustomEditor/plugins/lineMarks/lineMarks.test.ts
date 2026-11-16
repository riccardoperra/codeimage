import {history, redo, undo} from '@codemirror/commands';
import type {Transaction} from '@codemirror/state';
import {
  EditorSelection,
  EditorState,
  type TransactionSpec,
} from '@codemirror/state';
import type {EditorView} from '@codemirror/view';
import {describe, expect, it} from 'vitest';
import {pasteAnnotations} from './paste';
import {
  markLines,
  lineMarksField,
  lineMarksHistory,
  marksValue,
  readMarks,
  replaceMarks,
  toggleMark,
  toggleSpoiler,
  unmarkLines,
} from './state';

function editor() {
  const target = {
    state: EditorState.create({
      doc: 'one\ntwo\nthree\nfour\nfive\nsix',
      extensions: [lineMarksField, history(), lineMarksHistory],
    }),
    dispatch(tr: Transaction | TransactionSpec) {
      target.state = 'state' in tr ? tr.state : target.state.update(tr).state;
    },
  };
  return target;
}

describe('line marks', () => {
  it('adds separate focus selections, clears one kind at a time, and undoes each clear', () => {
    const target = editor();
    const view = target as unknown as EditorView;
    markLines(view, [1, 2], 'focus');
    markLines(view, [5, 6], 'focus');
    markLines(view, [2], 'added');
    expect(readMarks(target.state)).toEqual({
      lines: [{line: 2, kind: 'added'}],
      focusedLines: [1, 2, 5, 6],
    });
    unmarkLines(view, [2], 'added');
    expect(readMarks(target.state).focusedLines).toEqual([1, 2, 5, 6]);
    expect(readMarks(target.state).lines).toEqual([]);
    undo(target);
    expect(readMarks(target.state).lines).toEqual([{line: 2, kind: 'added'}]);
    unmarkLines(view, [1, 2], 'focus');
    expect(readMarks(target.state)).toEqual({
      lines: [{line: 2, kind: 'added'}],
      focusedLines: [5, 6],
    });
    undo(target);
    expect(readMarks(target.state).focusedLines).toEqual([1, 2, 5, 6]);
    markLines(view, [1, 2], null);
    expect(readMarks(target.state).focusedLines).toEqual([5, 6]);
    markLines(view, [5, 6], null);
    expect(readMarks(target.state).focusedLines).toEqual([]);
  });
  it('toggles a kind off only when every selected line already has it', () => {
    const target = editor();
    const view = target as unknown as EditorView;
    toggleMark(view, [2, 3], 'focus');
    toggleMark(view, [3, 4], 'focus');
    expect(readMarks(target.state).focusedLines).toEqual([2, 3, 4]);
    toggleMark(view, [3, 4], 'focus');
    expect(readMarks(target.state).focusedLines).toEqual([2]);
    toggleMark(view, [1], 'highlight');
    toggleMark(view, [1, 2], 'added');
    expect(readMarks(target.state).lines).toEqual([
      {line: 1, kind: 'added'},
      {line: 2, kind: 'added'},
    ]);
    toggleMark(view, [1, 2], 'added');
    expect(readMarks(target.state)).toEqual({lines: [], focusedLines: [2]});
  });
  it('maps, deletes and restores focused lines independently of highlights', () => {
    const target = editor();
    markLines(target as unknown as EditorView, [2], 'focus');
    target.dispatch({changes: {from: 0, insert: 'new\nnew\n'}});
    expect(readMarks(target.state)).toEqual({lines: [], focusedLines: [4]});
    target.dispatch({
      changes: {
        from: target.state.doc.line(4).from,
        to: target.state.doc.line(5).from,
      },
    });
    expect(readMarks(target.state).focusedLines).toEqual([]);
    undo(target);
    expect(readMarks(target.state).focusedLines).toEqual([4]);
  });
  it('merges pasted focus ranges with existing focus and undoes annotation conversion', () => {
    const target = editor();
    const view = target as unknown as EditorView;
    markLines(view, [1], 'focus');
    target.dispatch({selection: {anchor: target.state.doc.line(4).from}});
    pasteAnnotations(view, 'alpha // [!code ++] [!code focus:2]\nbeta\n', {
      line: '//',
    });
    expect(readMarks(target.state)).toEqual({
      lines: [{line: 4, kind: 'added'}],
      focusedLines: [1, 4, 5],
    });
    expect(target.state.doc.toString()).not.toContain('[!code');
    undo(target);
    expect(target.state.doc.toString()).toContain('[!code focus:2]');
    expect(readMarks(target.state)).toEqual({lines: [], focusedLines: [1]});
    redo(target);
    expect(readMarks(target.state).focusedLines).toEqual([1, 4, 5]);
  });
  it('maps a mark on line 5 to line 7 after inserting two lines above it', () => {
    const view = editor();
    view.dispatch(
      view.state.update({
        effects: replaceMarks.of(
          marksValue(view.state.doc, {
            lines: [{line: 5, kind: 'highlight'}],
            focusedLines: [],
          }),
        ),
      }),
    );
    view.dispatch(
      view.state.update({changes: {from: 0, insert: 'new\nnew\n'}}),
    );
    expect(readMarks(view.state).lines).toEqual([{line: 7, kind: 'highlight'}]);
  });
  it('undoes and redoes mark-only transactions', () => {
    const view = editor();
    view.dispatch(
      view.state.update({
        effects: replaceMarks.of(
          marksValue(view.state.doc, {
            lines: [{line: 2, kind: 'added'}],
            focusedLines: [2],
          }),
        ),
      }),
    );
    expect(undo(view)).toBe(true);
    expect(readMarks(view.state)).toEqual({lines: [], focusedLines: []});
    expect(redo(view)).toBe(true);
    expect(readMarks(view.state)).toEqual({
      lines: [{line: 2, kind: 'added'}],
      focusedLines: [2],
    });
  });
  it('restores a deleted marked line on undo', () => {
    const view = editor();
    view.dispatch(
      view.state.update({
        effects: replaceMarks.of(
          marksValue(view.state.doc, {
            lines: [{line: 2, kind: 'removed'}],
            focusedLines: [],
          }),
        ),
      }),
    );
    view.dispatch(
      view.state.update({
        changes: {
          from: view.state.doc.line(2).from,
          to: view.state.doc.line(3).from,
        },
      }),
    );
    expect(readMarks(view.state).lines).toEqual([]);
    undo(view);
    expect(readMarks(view.state).lines).toEqual([{line: 2, kind: 'removed'}]);
  });
  it('moves marks when inserting at the start of a marked line', () => {
    const view = editor();
    view.dispatch(
      view.state.update({
        effects: replaceMarks.of(
          marksValue(view.state.doc, {
            lines: [{line: 2, kind: 'highlight'}],
            focusedLines: [],
          }),
        ),
      }),
    );
    view.dispatch(
      view.state.update({
        changes: {from: view.state.doc.line(2).from, insert: 'above\n'},
      }),
    );
    expect(readMarks(view.state).lines).toEqual([{line: 3, kind: 'highlight'}]);
  });
  it('keeps the mark of the remaining line when two marked lines join', () => {
    const view = editor();
    view.dispatch(
      view.state.update({
        effects: replaceMarks.of(
          marksValue(view.state.doc, {
            lines: [
              {line: 2, kind: 'added'},
              {line: 3, kind: 'removed'},
            ],
            focusedLines: [],
          }),
        ),
      }),
    );
    const end = view.state.doc.line(2).to;
    view.dispatch(view.state.update({changes: {from: end, to: end + 1}}));
    expect(readMarks(view.state).lines).toEqual([{line: 2, kind: 'added'}]);
    expect(view.state.field(lineMarksField).decorations.size).toBe(1);
  });
  it('deduplicates lines and ignores marks outside the document', () => {
    const view = editor();
    view.dispatch(
      view.state.update({
        effects: replaceMarks.of(
          marksValue(view.state.doc, {
            lines: [
              {line: 0, kind: 'added'},
              {line: 2, kind: 'removed'},
              {line: 2, kind: 'highlight'},
              {line: 99, kind: 'added'},
            ],
            focusedLines: [],
          }),
        ),
      }),
    );
    expect(readMarks(view.state).lines).toEqual([{line: 2, kind: 'highlight'}]);
  });
});

describe('script line ranges', () => {
  const scripted = () => {
    const target = editor();
    target.dispatch({
      effects: replaceMarks.of(
        marksValue(target.state.doc, {
          lines: [],
          focusedLines: [],
          script: {
            steps: ['one', 'two', 'three'],
            lines: [
              {line: 2, enter: 2, leave: 3, focus: [2]},
              {line: 3, enter: 2, leave: 3},
            ],
          },
        }),
      ),
    });
    return target;
  };
  it('inherits neighbouring visibility for inserted rows without inheriting focus and preserves undo', () => {
    const target = scripted();
    const original = readMarks(target.state).script;
    target.dispatch({
      changes: {from: target.state.doc.line(3).from, insert: 'new\n'},
    });
    expect(readMarks(target.state).script).toEqual({
      steps: ['one', 'two', 'three'],
      lines: [
        {line: 2, enter: 2, leave: 3, focus: [2]},
        {line: 3, enter: 2, leave: 3},
        {line: 4, enter: 2, leave: 3},
      ],
    });
    undo(target);
    expect(readMarks(target.state).script).toEqual(original);
    redo(target);
    expect(readMarks(target.state).script?.lines).toHaveLength(3);
  });
  it('inherits below at the top and drops ranges of deleted lines', () => {
    const target = scripted();
    target.dispatch({
      effects: replaceMarks.of(
        marksValue(target.state.doc, {
          lines: [],
          focusedLines: [],
          script: {steps: ['one', 'two'], lines: [{line: 1, enter: 2}]},
        }),
      ),
    });
    target.dispatch({changes: {from: 0, insert: 'new\n'}});
    expect(readMarks(target.state).script?.lines).toEqual([
      {line: 1, enter: 2},
      {line: 2, enter: 2},
    ]);
    target.dispatch({changes: {from: 0, to: target.state.doc.line(3).from}});
    expect(readMarks(target.state).script?.lines).toEqual([]);
  });
  it('ordinary marks keep the script and inserting beside an unrestricted row stays unrestricted', () => {
    const target = scripted();
    toggleMark(target as unknown as EditorView, [1], 'highlight');
    expect(readMarks(target.state).script?.steps).toEqual([
      'one',
      'two',
      'three',
    ]);
    target.dispatch({
      changes: {from: target.state.doc.line(5).from, insert: 'new\n'},
    });
    expect(
      readMarks(target.state).script?.lines.map(line => line.line),
    ).toEqual([2, 3]);
  });
});

describe('spoilers', () => {
  it('hides part of a line, follows edits, and toggles off inside the selection', () => {
    const target = editor();
    const view = target as unknown as EditorView;
    const select = (from: number, to: number) =>
      target.dispatch({selection: EditorSelection.single(from, to)});
    select(5, 7);
    toggleSpoiler(view);
    expect(readMarks(target.state).spoilers).toEqual([
      {line: 2, from: 1, to: 3},
    ]);
    target.dispatch({changes: {from: 0, insert: 'zero\n'}});
    expect(readMarks(target.state).spoilers).toEqual([
      {line: 3, from: 1, to: 3},
    ]);
    select(2, 16);
    toggleSpoiler(view);
    expect(readMarks(target.state).spoilers).toEqual([
      {line: 1, from: 2, to: 4},
      {line: 2, from: 0, to: 3},
      {line: 3, from: 0, to: 3},
      {line: 4, from: 0, to: 3},
    ]);
    select(11, 12);
    toggleSpoiler(view);
    expect(readMarks(target.state).spoilers).toEqual([
      {line: 1, from: 2, to: 4},
      {line: 2, from: 0, to: 3},
      {line: 3, from: 0, to: 2},
      {line: 4, from: 0, to: 3},
    ]);
    undo(target);
    expect(readMarks(target.state).spoilers).toHaveLength(4);
  });

  it('round-trips through marksValue and drops ranges past the line end', () => {
    const state = EditorState.create({
      doc: 'abc\ndef',
      extensions: [
        lineMarksField.init(state =>
          marksValue(state.doc, {
            lines: [],
            focusedLines: [],
            spoilers: [
              {line: 2, from: 1, to: 9},
              {line: 7, from: 0, to: 1},
            ],
          }),
        ),
      ],
    });
    expect(readMarks(state).spoilers).toEqual([{line: 2, from: 1, to: 3}]);
  });
});
