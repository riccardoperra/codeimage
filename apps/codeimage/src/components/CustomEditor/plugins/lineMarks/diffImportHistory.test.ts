import {history, isolateHistory, redo, undo} from '@codemirror/commands';
import {EditorState} from '@codemirror/state';
import type {Transaction} from '@codemirror/state';
import {describe, expect, it} from 'vitest';
import type {DiffImportSnapshot} from './diffImportHistory';
import {
  diffImportHistory,
  importDiff,
  restoreDiffImport,
} from './diffImportHistory';
import {
  lineMarksField,
  lineMarksHistory,
  marksValue,
  readMarks,
  replaceMarks,
} from './state';

function fixture() {
  const before: DiffImportSnapshot = {
    activeEditorId: 'current',
    editors: [
      {
        id: 'existing',
        tab: {tabName: 'keep.ts'},
        code: 'keep',
        languageId: 'typescript',
        lineNumberStart: 1,
        marks: {lines: [], focus: false},
      },
      {
        id: 'current',
        tab: {tabName: 'original.py'},
        code: 'raw two-file diff',
        languageId: 'python',
        lineNumberStart: 7,
        marks: {lines: [{line: 1, kind: 'highlight'}], focus: true},
      },
    ],
  };
  const current = before.editors[1];
  const after: DiffImportSnapshot = {
    activeEditorId: before.activeEditorId,
    editors: [
      before.editors[0],
      {
        ...current,
        tab: {tabName: 'foo.ts'},
        code: 'old\nnext',
        languageId: 'typescript',
        marks: {
          lines: [
            {line: 1, kind: 'removed'},
            {line: 2, kind: 'added'},
          ],
          focus: false,
        },
      },
      {
        ...current,
        id: 'imported',
        tab: {tabName: 'bar.ts'},
        code: 'second file',
      },
    ],
  };
  let tabs = structuredClone(before);
  const target = {
    state: EditorState.create({
      doc: current.code,
      extensions: [
        history(),
        lineMarksField.init(state => marksValue(state.doc, current.marks)),
        lineMarksHistory,
        diffImportHistory,
      ],
    }),
    dispatch(tr: Transaction) {
      target.state = tr.state;
      restoreDiffImport(tr, snapshot => {
        tabs = structuredClone(snapshot);
      });
      const active = tabs.editors.find(tab => tab.id === tabs.activeEditorId)!;
      active.code = tr.state.doc.toString();
      active.marks = readMarks(tr.state);
    },
  };
  target.dispatch(
    target.state.update({
      changes: {
        from: 0,
        to: target.state.doc.length,
        insert: after.editors[1].code,
      },
      effects: [
        replaceMarks.of(
          marksValue(
            EditorState.create({doc: after.editors[1].code}).doc,
            after.editors[1].marks,
          ),
        ),
        importDiff.of({before, after}),
      ],
      annotations: isolateHistory.of('full'),
    }),
  );
  return {target, before, after, tabs: () => tabs};
}

describe('diff import history', () => {
  it('undoes the code, marks, tab names, added tabs, language and active tab in one step', () => {
    const {target, before, after, tabs} = fixture();
    expect(tabs()).toEqual(after);
    expect(undo(target)).toBe(true);
    expect(tabs()).toEqual(before);
    expect(redo(target)).toBe(true);
    expect(tabs()).toEqual(after);
  });

  it('undoes a later edit before undoing the complete import', () => {
    const {target, before, after, tabs} = fixture();
    target.dispatch(
      target.state.update({changes: {from: 0, insert: 'edited '}}),
    );
    expect(undo(target)).toBe(true);
    expect(tabs()).toEqual(after);
    expect(undo(target)).toBe(true);
    expect(tabs()).toEqual(before);
  });
});
