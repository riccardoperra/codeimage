import {isolateHistory} from '@codemirror/commands';
import {EditorState, Transaction} from '@codemirror/state';
import type {EditorView} from '@codemirror/view';
import type {TabMarks} from '@codeimage/store/editor/model';
import {ExternalChange} from 'solid-codemirror';
import type {CompartmentReconfigurationCallback} from 'solid-codemirror';
import {EDITOR_BASE_SETUP} from './editorSetup';
import {formattedMarks} from './formattedMarks';
import {
  lineMarksField,
  marksValue,
  readMarks,
  replaceMarks,
} from './plugins/lineMarks/state';

interface EditorDocument {
  id: string | undefined;
  code: string | undefined;
  marks: TabMarks;
  readOnly: boolean;
  view: EditorView | undefined;
}

export function updateEditorDocument(
  {id, code, marks, readOnly, view}: EditorDocument,
  activeId: string | undefined,
  configureHistory: CompartmentReconfigurationCallback,
) {
  if (
    !view ||
    !id ||
    code === undefined ||
    !view.state.field(lineMarksField, false)
  )
    return activeId;

  const changedTab = id !== activeId;
  const current = view.state.doc.toString();
  const changedCode = code !== current;
  if (!changedTab && !changedCode && !readOnly) return id;

  if (!changedTab && changedCode && !readOnly) {
    const previous = readMarks(view.state);
    view.dispatch({
      changes: {from: 0, to: view.state.doc.length, insert: code},
      effects: replaceMarks.of(
        marksValue(
          EditorState.create({doc: code}).doc,
          formattedMarks(previous, current, code),
        ),
      ),
      annotations: isolateHistory.of('full'),
    });
    return id;
  }

  const doc = changedCode
    ? EditorState.create({doc: code}).doc
    : view.state.doc;
  if (changedTab && !readOnly) configureHistory([]);
  try {
    view.dispatch({
      changes: changedCode
        ? {from: 0, to: view.state.doc.length, insert: code}
        : undefined,
      effects: replaceMarks.of(marksValue(doc, marks)),
      selection: changedTab ? {anchor: 0} : undefined,
      annotations: [
        ExternalChange.of(true),
        Transaction.addToHistory.of(false),
      ],
    });
  } finally {
    if (changedTab && !readOnly) configureHistory(EDITOR_BASE_SETUP);
  }
  view.requestMeasure();
  return id;
}
