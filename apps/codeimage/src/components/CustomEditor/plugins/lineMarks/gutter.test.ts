import {EditorState, EditorSelection} from '@codemirror/state';
import {gutterLineClass} from '@codemirror/view';
import {expect, test} from 'vitest';
import {gutterAction, gutterState, menuLines} from './gutter';
import {selectionBar, selectionFocus} from './controls';
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

test('line numbers carry the mark band so the whole row reads as marked', () => {
  const state = EditorState.create({
    doc,
    extensions: [
      lineMarksField.init(state =>
        marksValue(state.doc, {
          lines: [
            {line: 1, kind: 'added'},
            {line: 3, kind: 'highlight'},
          ],
          focusedLines: [3],
        }),
      ),
    ],
  });
  const classes = (line: number) => {
    const from = state.doc.line(line).from;
    const names: string[] = [];
    for (const set of state.facet(gutterLineClass))
      set.between(from, from, (_from, _to, marker) => {
        names.push(marker.elementClass);
      });
    return names.sort();
  };
  expect(classes(1)).toEqual(['cm-lineMark-added', 'cm-lineMarkDim']);
  expect(classes(2)).toEqual(['cm-lineMarkDim']);
  expect(classes(3)).toEqual(['cm-lineMark-highlight']);
});

test('selection toolbar follows editor focus without changing the selection', () => {
  let state = EditorState.create({
    doc,
    selection: {anchor: 0, head: 7},
    extensions: [selectionBar],
  });
  expect(state.field(selectionBar).tooltip).toBeNull();
  state = state.update({effects: selectionFocus.of(true)}).state;
  expect(state.field(selectionBar).tooltip?.pos).toBe(0);
  const selection = state.selection;
  state = state.update({effects: selectionFocus.of(false)}).state;
  expect(state.field(selectionBar).tooltip).toBeNull();
  expect(state.selection).toBe(selection);
  state = state.update({effects: selectionFocus.of(true)}).state;
  expect(state.field(selectionBar).tooltip?.pos).toBe(0);
  state = state.update({selection: {anchor: 0}}).state;
  expect(state.field(selectionBar).tooltip).toBeNull();
});

test('gutter interaction tracks hover, keyboard focus, active line and menu in state', () => {
  let state = EditorState.create({
    doc,
    extensions: [lineMarksField, gutterState],
  });
  state = state.update({
    effects: [
      gutterAction.of({kind: 'hover', line: 2}),
      gutterAction.of({kind: 'focus', line: 3}),
      selectionFocus.of(true),
      gutterAction.of({kind: 'news', value: true}),
      gutterAction.of({kind: 'menu', open: {line: 3, keyboard: true}}),
    ],
  }).state;
  expect(state.field(gutterState)).toEqual({
    hovered: 2,
    focused: 3,
    active: 1,
    tabStop: 3,
    news: true,
    open: {line: 3, keyboard: true},
  });
  state = state.update({selection: {anchor: state.doc.line(4).from}}).state;
  expect(state.field(gutterState)).toMatchObject({
    active: 4,
    hovered: null,
    tabStop: 4,
    open: null,
  });
  state = state.update({
    effects: selectionFocus.of(false),
  }).state;
  expect(state.field(gutterState).active).toBeNull();
});

test('document replacement clears stale gutter targets and keeps one valid tab stop', () => {
  let state = EditorState.create({
    doc,
    extensions: [lineMarksField, gutterState],
  });
  state = state.update({
    effects: [
      gutterAction.of({kind: 'hover', line: 4}),
      gutterAction.of({kind: 'focus', line: 4}),
      gutterAction.of({kind: 'menu', open: {line: 4, keyboard: false}}),
    ],
  }).state;
  state = state.update({
    changes: {from: 0, to: state.doc.length, insert: 'only'},
  }).state;
  expect(state.field(gutterState)).toMatchObject({
    hovered: null,
    focused: null,
    tabStop: 1,
    open: null,
  });
});
