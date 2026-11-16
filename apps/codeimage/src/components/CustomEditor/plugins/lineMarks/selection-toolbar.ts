import type {Extension} from '@codemirror/state';
import {Facet, StateEffect, StateField} from '@codemirror/state';
import {
  EditorView,
  showTooltip,
  ViewPlugin,
  type Tooltip,
  type TooltipView,
} from '@codemirror/view';
import {isApple} from '@core/constants/platform';
import {
  markCommands,
  selectedLines,
  shortcutKeys,
  type LineMarkLabels,
} from './commands';
import {hasMark, readMarks, toggleMark, type MarkKind} from './state';

const pointerSelecting = StateEffect.define<boolean>();

interface SelectionBar {
  pointer: boolean;
  tooltip: Tooltip | null;
  focused: boolean;
}

function toolbarView(labels: LineMarkLabels) {
  return (view: EditorView): TooltipView => {
    const dom = document.createElement('div');
    dom.className = 'cm-lineMarkToolbar';
    dom.setAttribute('role', 'toolbar');
    dom.setAttribute('aria-label', labels.toolbar);
    dom.addEventListener('mousedown', event => event.preventDefault());
    const button = (label: string, title: string, run: () => void) => {
      const element = dom.appendChild(document.createElement('button'));
      element.type = 'button';
      element.tabIndex = -1;
      element.textContent = label;
      element.title = title;
      element.onclick = () => {
        run();
        view.focus();
      };
      return element;
    };
    const toggles: [HTMLButtonElement, MarkKind][] = [];
    for (const command of markCommands) {
      const keys = shortcutKeys(command.key);
      const element = button(
        labels[command.id],
        `${command.id === 'focus' ? labels.focusHint : labels[command.id]} (${keys.join(isApple ? '' : '+')})`,
        () => toggleMark(view, selectedLines(view.state), command.kind),
      );
      element.setAttribute(
        'aria-keyshortcuts',
        `${isApple ? 'Meta' : 'Control'}+Alt+${command.key.slice(-1)}`,
      );
      if (command.kind) toggles.push([element, command.kind]);
    }
    const sync = () => {
      const marks = readMarks(view.state);
      const lines = selectedLines(view.state);
      for (const [element, kind] of toggles)
        element.setAttribute(
          'aria-pressed',
          String(lines.every(line => hasMark(marks, line, kind))),
        );
    };
    sync();
    return {dom, offset: {x: 0, y: 4}, update: sync};
  };
}

const labelsFacet = Facet.define<LineMarkLabels, LineMarkLabels>({
  combine: values => values[0],
});

export const selectionFocus = StateEffect.define<boolean>();

export const selectionBar = StateField.define<SelectionBar>({
  create: () => ({pointer: false, focused: false, tooltip: null}),
  update(value, tr) {
    let {pointer, focused} = value;
    for (const effect of tr.effects) {
      if (effect.is(pointerSelecting)) pointer = effect.value;
      if (effect.is(selectionFocus)) focused = effect.value;
    }
    const range = tr.state.selection.main;
    if (!focused || pointer || range.empty || tr.state.readOnly)
      return {pointer, focused, tooltip: null};
    const pos = tr.state.doc.lineAt(range.from).from;
    const tooltip =
      value.tooltip?.pos === pos
        ? value.tooltip
        : {
            pos,
            above: true,
            strictSide: true,
            create: toolbarView(tr.state.facet(labelsFacet)),
          };
    return {pointer, focused, tooltip};
  },
  provide: field =>
    showTooltip.compute([field], state => state.field(field).tooltip),
});

export function selectionToolbar(labels: LineMarkLabels): Extension {
  const pointerTracker = ViewPlugin.define(view => {
    let alive = true;
    let scheduled = false;
    const syncFocus = () => {
      if (scheduled || view.state.field(selectionBar).focused === view.hasFocus)
        return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        if (alive && view.state.field(selectionBar).focused !== view.hasFocus)
          view.dispatch({effects: selectionFocus.of(view.hasFocus)});
      });
    };
    syncFocus();
    const release = () => {
      if (view.state.field(selectionBar).pointer)
        view.dispatch({effects: pointerSelecting.of(false)});
    };
    const doc = view.dom.ownerDocument;
    doc.addEventListener('pointerup', release);
    doc.addEventListener('pointercancel', release);
    return {
      update: syncFocus,
      destroy: () => {
        alive = false;
        doc.removeEventListener('pointerup', release);
        doc.removeEventListener('pointercancel', release);
      },
    };
  });
  return [
    labelsFacet.of(labels),
    selectionBar,
    pointerTracker,
    EditorView.focusChangeEffect.of((_state, focused) =>
      selectionFocus.of(focused),
    ),
    EditorView.domEventHandlers({
      pointerdown(event, view) {
        if (event.pointerType === 'mouse' && event.button === 0)
          view.dispatch({effects: pointerSelecting.of(true)});
      },
    }),
  ];
}
