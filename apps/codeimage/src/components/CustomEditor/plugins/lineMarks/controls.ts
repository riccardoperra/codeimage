import type {Extension} from '@codemirror/state';
import {StateField} from '@codemirror/state';
import type {
  BlockInfo,
  EditorView,
  KeyBinding,
  Tooltip,
} from '@codemirror/view';
import {keymap, showTooltip} from '@codemirror/view';
import type {LineMark} from '../../../../state/editor/model';
import {markLines, readMarks, setLineMarks} from './state';

export interface LineMarkLabels {
  toolbar: string;
  highlight: string;
  added: string;
  removed: string;
  clear: string;
  focus: string;
  focusHint: string;
}

export const markCommands: {
  id: 'highlight' | 'added' | 'removed' | 'clear';
  key: string;
  kind: LineMark['kind'] | null;
}[] = [
  {id: 'highlight', key: 'Mod-Alt-1', kind: 'highlight'},
  {id: 'added', key: 'Mod-Alt-2', kind: 'added'},
  {id: 'removed', key: 'Mod-Alt-3', kind: 'removed'},
  {id: 'clear', key: 'Mod-Alt-0', kind: null},
];

export function selectedLines(state: EditorView['state']): number[] {
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
  run: view => markLines(view, selectedLines(view.state), kind),
  preventDefault: true,
}));

function selectionBar(labels: LineMarkLabels) {
  return StateField.define<readonly Tooltip[]>({
    create: () => [],
    update(_value, tr) {
      const range = tr.state.selection.main;
      if (range.empty || tr.state.readOnly) return [];
      return [
        {
          pos: range.from,
          end: range.to,
          above: true,
          strictSide: false,
          create(view) {
            const dom = document.createElement('div');
            dom.className = 'cm-lineMarkToolbar';
            dom.setAttribute('role', 'toolbar');
            dom.setAttribute('aria-label', labels.toolbar);
            dom.addEventListener('mousedown', event => event.preventDefault());
            for (const command of markCommands) {
              const button = dom.appendChild(document.createElement('button'));
              button.type = 'button';
              button.textContent = labels[command.id];
              const shortcut = command.key
                .replace(
                  'Mod',
                  /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl',
                )
                .replaceAll('-', '+');
              button.title = `${labels[command.id]} (${shortcut})`;
              button.onclick = () => {
                markLines(view, selectedLines(view.state), command.kind);
                view.focus();
              };
            }
            const focus = dom.appendChild(document.createElement('button'));
            focus.type = 'button';
            focus.textContent = labels.focus;
            focus.title = labels.focusHint;
            focus.setAttribute(
              'aria-pressed',
              String(readMarks(view.state).focus),
            );
            focus.onclick = () => {
              const marks = readMarks(view.state);
              setLineMarks(view, {...marks, focus: !marks.focus});
              view.focus();
            };
            return {dom};
          },
        },
      ];
    },
    provide: field =>
      showTooltip.computeN([field], state => state.field(field)),
  });
}

export function gutterMarkMouseDown(
  view: EditorView,
  line: BlockInfo,
  event: Event,
): boolean {
  if (!(event instanceof MouseEvent)) return false;
  if (view.state.readOnly || event.button !== 0) return false;
  event.preventDefault();
  const start = view.state.doc.lineAt(line.from).number;
  const before = readMarks(view.state);
  const kind = before.lines.some(
    mark => mark.line === start && mark.kind === 'highlight',
  )
    ? null
    : 'highlight';
  let end = start;
  const move = (moveEvent: MouseEvent) => {
    const pos = view.posAtCoords({
      x: view.contentDOM.getBoundingClientRect().left + 1,
      y: moveEvent.clientY,
    });
    if (pos !== null) end = view.state.doc.lineAt(pos).number;
  };
  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
    window.removeEventListener('blur', up);
    const lines = Array.from(
      {length: Math.abs(end - start) + 1},
      (_, i) => Math.min(start, end) + i,
    );
    markLines(view, lines, kind);
    view.focus();
  };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up, {once: true});
  window.addEventListener('blur', up, {once: true});
  return true;
}

export function lineMarkControls(labels: LineMarkLabels): Extension {
  return [selectionBar(labels), keymap.of(lineMarkKeymap)];
}
