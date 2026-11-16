import {popupArea} from './popup';
import type {EditorView} from '@codemirror/view';
import type {LineMarkLabels} from './commands';
import type {LineMarkPlacement} from './placement';
import {gutterAction, menuLines} from './gutter-state';
import {menuButtons} from './menu-buttons';

export function createMenuView(options: {
  view: EditorView;
  open: {line: number; keyboard: boolean};
  labels: LineMarkLabels;
  placement: LineMarkPlacement;
}) {
  const {view, open, labels, placement} = options;
  const {rectFor, lineShown, offscreen} = placement;

  const {line, keyboard} = open;
  const doc = view.dom.ownerDocument;
  const close = (restoreFocus = false) =>
    view.dispatch({
      effects: [
        gutterAction.of({kind: 'menu', open: null}),
        ...(restoreFocus ? [gutterAction.of({kind: 'focus', line})] : []),
      ],
    });
  const lines = menuLines(view.state, line);
  const dom = doc.createElement('div');
  dom.className = 'cm-lineMarkMenu';
  dom.tabIndex = -1;
  dom.dataset.keyboard = String(keyboard);
  dom.setAttribute('role', 'menu');
  dom.setAttribute('aria-label', labels.toolbar);
  const head = dom.appendChild(doc.createElement('div'));
  head.className = 'cm-lineMarkMenuHeader';
  head.textContent =
    lines.length > 1
      ? labels.selection(Math.min(...lines), Math.max(...lines))
      : labels.line(line);
  const buttons = menuButtons({view, dom, lines, labels, close});
  dom.onkeydown = event => {
    const index = buttons.findIndex(button => button === doc.activeElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      close(true);
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      let next = (index + step + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else if (index < 0) next = step > 0 ? 0 : buttons.length - 1;
      buttons[next].focus();
    }
  };

  const outside = (event: Event) => {
    if (!(event.target instanceof Node) || dom.contains(event.target)) return;
    if (
      event.target instanceof Element &&
      event.target.closest('.cm-lineMarkControl')
    )
      return;
    close();
  };
  return {
    dom,
    offset: {x: 0, y: 4},
    getCoords: () => {
      const rect = rectFor(view, line);
      const space = view.state.facet(popupArea)(view);
      return lineShown(view, line) &&
        rect.bottom > space.top &&
        rect.top < space.bottom &&
        rect.right >= space.left &&
        rect.right - 20 <= space.right
        ? {
            left: rect.right - 20,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
          }
        : offscreen;
    },
    mount: () => {
      doc.addEventListener('pointerdown', outside);
      doc.addEventListener('focusin', outside);
      queueMicrotask(() => {
        if (dom.isConnected)
          (keyboard ? buttons[0] : dom).focus({preventScroll: true});
      });
    },
    destroy: () => {
      doc.removeEventListener('pointerdown', outside);
      doc.removeEventListener('focusin', outside);
    },
  };
}
