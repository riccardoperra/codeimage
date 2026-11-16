import type {EditorView} from '@codemirror/view';
import {markCommands, shortcutKeys, type LineMarkLabels} from './commands';
import {hasMark, readMarks, toggleMark} from './state';

export function menuButtons(options: {
  view: EditorView;
  dom: HTMLElement;
  lines: number[];
  labels: LineMarkLabels;
  close: (restoreFocus: boolean) => void;
}) {
  const {view, dom, lines, labels, close} = options;
  const doc = view.dom.ownerDocument;
  const marks = readMarks(view.state);
  const buttons: HTMLButtonElement[] = [];
  for (const id of [
    'added',
    'removed',
    'highlight',
    'focus',
    'clear',
  ] as const) {
    const command = markCommands.find(command => command.id === id);
    if (!command) continue;
    if (id === 'clear')
      dom
        .appendChild(doc.createElement('hr'))
        .setAttribute('role', 'separator');
    const button = dom.appendChild(doc.createElement('button'));
    button.type = 'button';
    button.tabIndex = -1;
    const role = {
      clear: 'menuitem',
      focus: 'menuitemcheckbox',
      added: 'menuitemradio',
      removed: 'menuitemradio',
      highlight: 'menuitemradio',
    }[id];
    button.setAttribute('role', role);
    button.setAttribute(
      'aria-label',
      id === 'clear' ? labels.removeMark : labels[id],
    );
    const kind = command.kind;
    const checked =
      kind !== null && lines.every(line => hasMark(marks, line, kind));
    if (id !== 'clear') button.setAttribute('aria-checked', String(checked));
    else
      button.disabled = !lines.some(
        line =>
          marks.lines.some(mark => mark.line === line) ||
          marks.focusedLines.includes(line),
      );
    const glyph = button.appendChild(doc.createElement('span'));
    glyph.className = `cm-lineMarkGlyph cm-lineMarkGlyph-${id}`;
    glyph.setAttribute('aria-hidden', 'true');
    glyph.textContent = {
      added: '+',
      removed: '−',
      clear: '×',
      highlight: '',
      focus: '',
    }[id];
    const label = button.appendChild(doc.createElement('span'));
    label.className = 'cm-lineMarkMenuLabel';
    label.textContent = id === 'clear' ? labels.removeMark : labels[id];
    const keys = button.appendChild(doc.createElement('span'));
    keys.className = 'cm-lineMarkShortcut';
    keys.setAttribute('aria-hidden', 'true');
    keys.textContent = shortcutKeys(command.key).join(' ');
    const check = button.appendChild(doc.createElement('span'));
    check.className = 'cm-lineMarkCheck';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = checked ? '✓' : '';
    button.onclick = () => {
      toggleMark(view, lines, command.kind);
      close(true);
    };
    if (!button.disabled) buttons.push(button);
  }
  return buttons;
}
