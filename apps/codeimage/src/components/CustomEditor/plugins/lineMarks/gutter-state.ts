import {StateEffect, StateField, type EditorState} from '@codemirror/state';
import {selectedLines} from './commands';
import {selectionFocus} from './selection-toolbar';
import {lineMarksField} from './state';
import type {LineMark} from '@codeimage/store/editor/model';

export function menuLines(state: EditorState, line: number): number[] {
  const insideSelection = state.selection.ranges.some(range => {
    if (range.empty) return false;
    const first = state.doc.lineAt(range.from).number;
    const last = state.doc.lineAt(Math.max(range.from, range.to - 1)).number;
    return first !== last && line >= first && line <= last;
  });
  return insideSelection ? selectedLines(state) : [line];
}

interface GutterState {
  hovered: number | null;
  active: number | null;
  focused: number | null;
  tabStop: number;
  news: boolean;
  open: {line: number; keyboard: boolean} | null;
}

type GutterAction =
  | {kind: 'hover' | 'focus'; line: number | null}
  | {kind: 'news'; value: boolean}
  | {kind: 'menu'; open: GutterState['open']};

export const gutterAction = StateEffect.define<GutterAction>();

function applyAction(next: GutterState, action: GutterAction) {
  if (action.kind === 'hover') next.hovered = action.line;
  else if (action.kind === 'focus') {
    next.focused = action.line;
    if (action.line !== null) next.tabStop = action.line;
  } else if (action.kind === 'news') next.news = action.value;
  else if (action.kind === 'menu') {
    next.open = action.open;
    if (!action.open) next.hovered = null;
  }
}

export const gutterState = StateField.define<GutterState>({
  create: state => ({
    hovered: null,
    active: null,
    focused: null,
    tabStop: state.doc.lineAt(state.selection.main.head).number,
    news: false,
    open: null,
  }),
  update(value, tr) {
    const cursor = tr.state.doc.lineAt(tr.state.selection.main.head).number;
    const next = {...value};
    if (
      tr.docChanged ||
      tr.selection ||
      tr.state.readOnly ||
      tr.startState.field(lineMarksField, false) !==
        tr.state.field(lineMarksField, false)
    ) {
      if (next.open) next.hovered = null;
      next.open = null;
    }
    if (tr.docChanged) {
      next.hovered = null;
      next.focused = null;
    }
    if (tr.selection || tr.docChanged) {
      next.tabStop = cursor;
      if (next.active !== null) next.active = cursor;
    }
    for (const effect of tr.effects) {
      if (effect.is(selectionFocus)) {
        next.active = effect.value ? cursor : null;
        continue;
      }
      if (!effect.is(gutterAction)) continue;
      applyAction(next, effect.value);
    }
    return (Object.keys(next) as (keyof GutterState)[]).every(
      key => next[key] === value[key],
    )
      ? value
      : next;
  },
});

export function markAt(state: EditorState, line: number) {
  const {decorations, focused} = state.field(lineMarksField);
  const from = state.doc.line(line).from;
  let kind: LineMark['kind'] | undefined;
  let focus = false;
  decorations.between(from, from, (start, _end, decoration) => {
    if (start === from) kind = decoration.spec.attributes['data-mark'];
  });
  focused.between(from, from, start => {
    if (start === from) focus = true;
  });
  return {kind, focused: focus};
}
