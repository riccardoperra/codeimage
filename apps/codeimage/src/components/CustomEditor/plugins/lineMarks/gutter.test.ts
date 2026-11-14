import {EditorState, EditorSelection} from '@codemirror/state';
import {expect, test} from 'vitest';
import {menuLines} from './gutter';
import type {TabMarks} from '../../../../state/editor/model';
import {lineMarksField, marksValue, readMarks} from './state';

const doc = 'one\ntwo\nthree\nfour';

test('targets a line outside the selection and the whole selection from inside', () => {
  const state = EditorState.create({doc, selection: {anchor: 4, head: 13}});
  expect(menuLines(state, 1)).toEqual([1]);
  expect(menuLines(state, 2)).toEqual([2, 3]);
  expect(menuLines(state, 3)).toEqual([2, 3]);
  expect(menuLines(state, 4)).toEqual([4]);
});

test('excludes the line at an exclusive selection end and handles reverse selection', () => {
  const state = EditorState.create({doc, selection: {anchor: 14, head: 4}});
  expect(menuLines(state, 2)).toEqual([2, 3]);
  expect(menuLines(state, 4)).toEqual([4]);
});

test('a caret or a single selected line keeps the menu local', () => {
  expect(
    menuLines(EditorState.create({doc, selection: {anchor: 4}}), 2),
  ).toEqual([2]);
  expect(
    menuLines(EditorState.create({doc, selection: {anchor: 4, head: 7}}), 2),
  ).toEqual([2]);
  const state = EditorState.create({
    doc,
    selection: EditorSelection.create([
      EditorSelection.cursor(0),
      EditorSelection.cursor(4),
    ]),
    extensions: [EditorState.allowMultipleSelections.of(true)],
  });
  expect(menuLines(state, 1)).toEqual([1]);
});

test('JSON snapshot round-trip preserves the persisted marks data exactly', () => {
  const marks = {
    lines: [
      {line: 1, kind: 'removed'},
      {line: 2, kind: 'added'},
      {line: 3, kind: 'highlight'},
    ],
    focusedLines: [2, 4],
  } satisfies TabMarks;
  const snapshot = JSON.parse(JSON.stringify(marks));
  const state = EditorState.create({
    doc,
    extensions: [lineMarksField.init(state => marksValue(state.doc, snapshot))],
  });
  expect(readMarks(state)).toEqual(marks);
  expect(JSON.stringify(readMarks(state))).toBe(JSON.stringify(marks));
  expect(Object.keys(readMarks(state))).toEqual(['lines', 'focusedLines']);
});
