import {history, redo, undo} from '@codemirror/commands';
import type {Transaction} from '@codemirror/state';
import {EditorState} from '@codemirror/state';
import {describe, expect, it} from 'vitest';
import {
  lineMarksField,
  lineMarksHistory,
  marksValue,
  readMarks,
  replaceMarks,
} from './state';

function editor() {
  const target = {
    state: EditorState.create({
      doc: 'one\ntwo\nthree\nfour\nfive\nsix',
      extensions: [lineMarksField, history(), lineMarksHistory],
    }),
    dispatch(tr: Transaction) {
      target.state = tr.state;
    },
  };
  return target;
}

describe('line marks', () => {
  it('maps a mark on line 5 to line 7 after inserting two lines above it', () => {
    const view = editor();
    view.dispatch(
      view.state.update({
        effects: replaceMarks.of(
          marksValue(view.state.doc, {
            lines: [{line: 5, kind: 'highlight'}],
            focus: false,
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
            focus: true,
          }),
        ),
      }),
    );
    expect(undo(view)).toBe(true);
    expect(readMarks(view.state)).toEqual({lines: [], focus: false});
    expect(redo(view)).toBe(true);
    expect(readMarks(view.state)).toEqual({
      lines: [{line: 2, kind: 'added'}],
      focus: true,
    });
  });
  it('restores a deleted marked line on undo', () => {
    const view = editor();
    view.dispatch(
      view.state.update({
        effects: replaceMarks.of(
          marksValue(view.state.doc, {
            lines: [{line: 2, kind: 'removed'}],
            focus: false,
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
            focus: false,
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
            focus: false,
          }),
        ),
      }),
    );
    expect(readMarks(view.state).lines).toEqual([{line: 2, kind: 'highlight'}]);
  });
});
