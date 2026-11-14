import type {CommentTokens} from '@codemirror/commands';
import {isolateHistory} from '@codemirror/commands';
import {EditorSelection} from '@codemirror/state';
import type {EditorView} from '@codemirror/view';
import {parseAnnotations} from '../../../../core/diff/parseAnnotations';
import {marksValue, readMarks, replaceMarks} from './state';

export function pasteAnnotations(
  view: EditorView,
  text: string,
  tokens: CommentTokens,
): number {
  const parsed = parseAnnotations(text, tokens);
  if (!parsed.count) return 0;

  // Keep the raw paste as its own history entry so Undo restores the notation.
  const paste = view.state.update({
    ...view.state.replaceSelection(text),
    userEvent: 'input.paste',
    annotations: isolateHistory.of('full'),
  });
  view.dispatch(paste);
  const insertions: {from: number; to: number}[] = [];
  paste.changes.iterChanges((_fromA, _toA, from, to) =>
    insertions.push({from, to}),
  );
  const conversion = view.state.update({
    changes: insertions.map(range => ({...range, insert: parsed.code})),
  });
  const mappedMarks = readMarks(conversion.state);
  for (const insertion of insertions) {
    const from = conversion.changes.mapPos(insertion.from, -1);
    const first = conversion.state.doc.lineAt(from).number;
    for (const mark of parsed.marks.lines) {
      mappedMarks.lines.push({...mark, line: first + mark.line - 1});
    }
  }
  mappedMarks.focus ||= parsed.marks.focus;
  const last = insertions[insertions.length - 1];
  view.dispatch({
    changes: conversion.changes,
    effects: replaceMarks.of(marksValue(conversion.state.doc, mappedMarks)),
    selection: EditorSelection.cursor(conversion.changes.mapPos(last.to, 1)),
    annotations: isolateHistory.of('full'),
    userEvent: 'input.annotations',
  });
  return parsed.count * insertions.length;
}
