import type {EditorState} from '@codemirror/state';
import type {KeyBinding} from '@codemirror/view';
import {isApple} from '@core/constants/platform';
import type {MarkKind} from './state';
import {toggleMark} from './state';

export interface LineMarkLabels {
  toolbar: string;
  highlight: string;
  added: string;
  removed: string;
  clear: string;
  focus: string;
  focusHint: string;
  removeMark: string;
  unmarked: string;
  line: (line: number) => string;
  selection: (from: number, to: number) => string;
}

export const markCommands: {
  id: 'highlight' | 'added' | 'removed' | 'focus' | 'clear';
  key: string;
  kind: MarkKind | null;
}[] = [
  {id: 'highlight', key: 'Mod-Alt-1', kind: 'highlight'},
  {id: 'added', key: 'Mod-Alt-2', kind: 'added'},
  {id: 'removed', key: 'Mod-Alt-3', kind: 'removed'},
  {id: 'focus', key: 'Mod-Alt-4', kind: 'focus'},
  {id: 'clear', key: 'Mod-Alt-0', kind: null},
];

export function shortcutKeys(key: string): string[] {
  const digit = key.slice(-1);
  return isApple ? ['⌘', '⌥', digit] : ['Ctrl', 'Alt', digit];
}

export function selectedLines(state: EditorState): number[] {
  const lines = new Set<number>();
  for (const range of state.selection.ranges) {
    const first = state.doc.lineAt(range.from).number;
    const last = state.doc.lineAt(
      range.empty ? range.to : Math.max(range.from, range.to - 1),
    ).number;
    for (let line = first; line <= last; line++) lines.add(line);
  }
  return [...lines];
}

export const lineMarkKeymap: KeyBinding[] = markCommands.map(({key, kind}) => ({
  key,
  run: view => toggleMark(view, selectedLines(view.state), kind),
  preventDefault: true,
}));
