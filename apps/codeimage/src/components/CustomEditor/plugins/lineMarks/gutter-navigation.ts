import {EditorView, runScopeHandlers} from '@codemirror/view';
import {gutterAction, gutterState} from './gutter-state';

const entries = new WeakMap<
  EditorView,
  {element: HTMLElement; passing: boolean}
>();

export function attachLineMarkEntry(view: EditorView, element: HTMLElement) {
  const entry = {element, passing: false};
  entries.set(view, entry);
  const focus = () => {
    if (entry.passing || view.state.readOnly) return;
    const ui = view.state.field(gutterState, false);
    if (!ui) return;
    if (ui.focused === ui.tabStop)
      view.dispatch({effects: gutterAction.of({kind: 'focus', line: null})});
    view.dispatch({
      effects: gutterAction.of({kind: 'focus', line: ui.tabStop}),
    });
  };
  const blur = () => {
    entry.passing = false;
  };
  element.addEventListener('focus', focus);
  element.addEventListener('blur', blur);
  return () => {
    element.removeEventListener('focus', focus);
    element.removeEventListener('blur', blur);
    if (entries.get(view) === entry) entries.delete(view);
  };
}

export function keyDown(view: EditorView, event: KeyboardEvent, line: number) {
  const moveFocus = (line: number) => {
    const target = Math.min(Math.max(line, 1), view.state.doc.lines);
    view.dispatch({
      effects: [
        gutterAction.of({kind: 'focus', line: target}),
        EditorView.scrollIntoView(view.state.doc.line(target).from, {
          y: 'nearest',
        }),
      ],
    });
  };
  if (event.key === 'Tab') {
    const entry = entries.get(view);
    if (!event.shiftKey) {
      event.preventDefault();
      view.focus();
    } else if (entry) {
      entry.passing = true;
      entry.element.focus({preventScroll: true});
    }
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    moveFocus(line + (event.key === 'ArrowDown' ? 1 : -1));
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    moveFocus(event.key === 'Home' ? 1 : view.state.doc.lines);
  } else if (
    (event.ctrlKey || event.metaKey) &&
    runScopeHandlers(view, event, 'editor')
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
}
