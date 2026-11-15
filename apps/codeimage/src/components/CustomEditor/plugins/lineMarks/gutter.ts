import {Prec, type EditorState, type Extension} from '@codemirror/state';
import {
  EditorView,
  gutter,
  GutterMarker,
  runScopeHandlers,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';
import type {LineMarkLabels} from './controls';
import {markCommands, selectedLines, shortcutKeys} from './controls';
import {hasMark, lineMarksField, readMarks, toggleMark} from './state';
import type {LineMark} from '../../../../state/editor/model';
import './gutter.css';

export function menuLines(state: EditorState, line: number): number[] {
  const insideSelection = state.selection.ranges.some(range => {
    if (range.empty) return false;
    const first = state.doc.lineAt(range.from).number;
    const last = state.doc.lineAt(Math.max(range.from, range.to - 1)).number;
    return first !== last && line >= first && line <= last;
  });
  return insideSelection ? selectedLines(state) : [line];
}

interface ShownMarker {
  button: HTMLButtonElement;
  line: number;
  rect: DOMRect;
}

export function lineMarkGutter(labels: LineMarkLabels): Extension {
  const menuPlugin = ViewPlugin.define(view => {
    const doc = view.dom.ownerDocument;
    const win = doc.defaultView!;
    let open: {dom: HTMLDivElement; line: number} | null = null;
    let hovered: number | null = null;
    let focusAfterMeasure: number | null = null;
    const markerFor = (line: number) =>
      view.dom.querySelector<HTMLButtonElement>(
        `.cm-lineMarkMarker[data-mark-line="${line}"]`,
      );
    const focusedLine = () => {
      const active = doc.activeElement;
      return active instanceof HTMLElement &&
        active.matches('.cm-lineMarkMarker') &&
        view.dom.contains(active)
        ? Number(active.dataset.markLine)
        : null;
    };
    const cursorLine = () =>
      view.state.doc.lineAt(view.state.selection.main.head).number;

    // Markers live in the top layer so they keep a 20px target on the scaled
    // canvas. Only a few are shown at once, and only where the editor itself is
    // the topmost element, so they never cover the header, the dock or dialogs.
    const exposeGutter = () =>
      view.requestMeasure({
        key: exposeGutter,
        read: (): ShownMarker[] => {
          const forced = new Set(
            [open?.line, focusAfterMeasure].filter(
              (line): line is number => line != null,
            ),
          );
          const lines = new Set([...forced, cursorLine()]);
          const focused = focusedLine();
          if (focused !== null) lines.add(focused);
          if (hovered !== null) lines.add(hovered);
          return [...lines].flatMap(line => {
            const button = markerFor(line);
            const cell = button?.parentElement;
            if (!button || !cell) return [];
            const rect = cell.getBoundingClientRect();
            // Scaled cells can be narrower than 10px; keep the probe inside.
            const x = (rect.left + rect.right) / 2;
            const y = rect.top + rect.height / 2;
            if (y < 0 || y > win.innerHeight || x < 0 || x > win.innerWidth)
              return [];
            if (!forced.has(line)) {
              const top = doc
                .elementsFromPoint(x, y)
                .find(element => !element.closest('.cm-lineMarkMarker'));
              if (!top || !view.dom.contains(top)) return [];
            }
            return [{button, line, rect}];
          });
        },
        write: shown => {
          view.dom
            .querySelector('.cm-lineMarkGutter')
            ?.parentElement?.removeAttribute('aria-hidden');
          const visible = new Set(shown.map(marker => marker.button));
          for (const button of view.dom.querySelectorAll<HTMLButtonElement>(
            '.cm-lineMarkMarker',
          ))
            if (!visible.has(button) && button.matches(':popover-open'))
              button.hidePopover();
          const tabStop = focusAfterMeasure ?? focusedLine() ?? cursorLine();
          const active = view.hasFocus ? cursorLine() : null;
          for (const {button, line, rect} of shown) {
            // Scaled canvases shrink rows below a usable touch height.
            const height = Math.max(rect.height, 24);
            button.style.left = `${rect.right - 20}px`;
            button.style.top = `${rect.top + (rect.height - height) / 2}px`;
            button.style.height = `${height}px`;
            button.tabIndex = line === tabStop ? 0 : -1;
            button.toggleAttribute('data-hovered', line === hovered);
            button.toggleAttribute('data-active', line === active);
            if (!button.matches(':popover-open')) button.showPopover();
          }
          if (focusAfterMeasure !== null) {
            markerFor(focusAfterMeasure)?.focus({preventScroll: true});
            focusAfterMeasure = null;
          }
        },
      });

    const hoverLine = (event: PointerEvent) => {
      if (open || event.pointerType !== 'mouse') return;
      const pos = view.posAtCoords({
        x: view.contentDOM.getBoundingClientRect().left + 1,
        y: event.clientY,
      });
      const line = pos === null ? null : view.state.doc.lineAt(pos).number;
      if (line === hovered) return;
      hovered = line;
      exposeGutter();
    };
    const clearHover = () => {
      if (open || hovered === null) return;
      hovered = null;
      exposeGutter();
    };
    const close = (restoreFocus = false) => {
      if (!open) return;
      const {dom, line} = open;
      open = null;
      hovered = null;
      dom.remove();
      const marker = markerFor(line);
      marker?.setAttribute('aria-expanded', 'false');
      if (restoreFocus) {
        marker?.focus({preventScroll: true});
        // A mark change rebuilds the marker, so focus it again after measuring.
        focusAfterMeasure = line;
      }
      exposeGutter();
    };
    const outside = (event: Event) => {
      if (!(event.target instanceof Node) || !open) return;
      if (
        !open.dom.contains(event.target) &&
        !markerFor(open.line)?.contains(event.target)
      )
        close();
    };
    const dismiss = () => {
      close();
      exposeGutter();
    };
    view.dom.addEventListener('pointermove', hoverLine);
    view.dom.addEventListener('pointerleave', clearHover);
    doc.addEventListener('pointerdown', outside);
    doc.addEventListener('focusin', outside);
    win.addEventListener('resize', dismiss);
    win.addEventListener('scroll', dismiss, true);
    exposeGutter();

    const moveFocus = (line: number) => {
      const target = Math.min(Math.max(line, 1), view.state.doc.lines);
      focusAfterMeasure = target;
      view.dispatch({
        effects: EditorView.scrollIntoView(view.state.doc.line(target).from, {
          y: 'nearest',
        }),
      });
      exposeGutter();
    };

    return {
      keyDown(event: KeyboardEvent, line: number) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
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
          focusAfterMeasure = line;
          exposeGutter();
        }
      },
      blurred(event: FocusEvent) {
        const next = event.relatedTarget;
        if (!(next instanceof Element) || !next.closest('.cm-lineMarkMarker'))
          exposeGutter();
      },
      open(line: number, keyboard: boolean) {
        if (view.state.readOnly) return;
        const wasOpen = open?.line === line;
        close();
        if (wasOpen) return;
        const anchor = markerFor(line);
        if (!anchor) return;
        const lines = menuLines(view.state, line);
        const marks = readMarks(view.state);
        const dom = doc.createElement('div');
        dom.className = 'cm-lineMarkMenu';
        dom.popover = 'manual';
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
        const buttons: HTMLButtonElement[] = [];
        for (const id of [
          'added',
          'removed',
          'highlight',
          'focus',
          'clear',
        ] as const) {
          const command = markCommands.find(command => command.id === id)!;
          if (id === 'clear')
            dom
              .appendChild(doc.createElement('hr'))
              .setAttribute('role', 'separator');
          const button = dom.appendChild(doc.createElement('button'));
          button.type = 'button';
          button.tabIndex = -1;
          button.setAttribute(
            'role',
            id === 'clear'
              ? 'menuitem'
              : id === 'focus'
                ? 'menuitemcheckbox'
                : 'menuitemradio',
          );
          button.setAttribute(
            'aria-label',
            id === 'clear' ? labels.removeMark : labels[id],
          );
          const kind = command.kind;
          const checked =
            kind !== null && lines.every(line => hasMark(marks, line, kind));
          if (id !== 'clear')
            button.setAttribute('aria-checked', String(checked));
          else
            button.disabled = !lines.some(
              line =>
                marks.lines.some(mark => mark.line === line) ||
                marks.focusedLines.includes(line),
            );
          const glyph = button.appendChild(doc.createElement('span'));
          glyph.className = `cm-lineMarkGlyph cm-lineMarkGlyph-${id}`;
          glyph.setAttribute('aria-hidden', 'true');
          glyph.textContent =
            id === 'added'
              ? '+'
              : id === 'removed'
                ? '−'
                : id === 'clear'
                  ? '×'
                  : '';
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
            close(true);
            toggleMark(view, lines, command.kind);
          };
          if (!button.disabled) buttons.push(button);
        }
        dom.onkeydown = event => {
          const index = buttons.findIndex(
            button => button === doc.activeElement,
          );
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close(true);
          } else if (event.key === 'Tab') {
            event.preventDefault();
            close(true);
          } else if (
            ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
          ) {
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? buttons.length - 1
                  : index < 0
                    ? step > 0
                      ? 0
                      : buttons.length - 1
                    : (index + step + buttons.length) % buttons.length;
            buttons[next].focus();
          }
        };
        doc.body.appendChild(dom);
        dom.showPopover();
        const rect = anchor.getBoundingClientRect();
        // Layout size, not the rect, which is scaled by the entrance transition.
        const box = {width: dom.offsetWidth, height: dom.offsetHeight};
        const left = Math.max(
          8,
          Math.min(rect.left, win.innerWidth - box.width - 8),
        );
        const below = rect.bottom + 4 + box.height <= win.innerHeight - 8;
        const top = below
          ? rect.bottom + 4
          : Math.max(8, rect.top - box.height - 4);
        dom.style.left = `${left}px`;
        dom.style.top = `${top}px`;
        dom.style.transformOrigin = `${rect.left + rect.width / 2 - left}px ${below ? 0 : box.height}px`;
        open = {dom, line};
        anchor.setAttribute('aria-expanded', 'true');
        // A pointer opening focuses the menu itself so no item shows a focus ring.
        (keyboard ? buttons[0] : dom).focus({preventScroll: true});
      },
      update(update: ViewUpdate) {
        const marksChanged =
          update.startState.field(lineMarksField) !==
          update.state.field(lineMarksField);
        if (
          update.docChanged ||
          update.selectionSet ||
          update.state.readOnly ||
          marksChanged
        )
          close();
        if (
          update.docChanged ||
          update.selectionSet ||
          update.focusChanged ||
          update.geometryChanged ||
          update.viewportChanged ||
          marksChanged
        )
          exposeGutter();
      },
      destroy() {
        close();
        view.dom.removeEventListener('pointermove', hoverLine);
        view.dom.removeEventListener('pointerleave', clearHover);
        doc.removeEventListener('pointerdown', outside);
        doc.removeEventListener('focusin', outside);
        win.removeEventListener('resize', dismiss);
        win.removeEventListener('scroll', dismiss, true);
        view.dom
          .querySelector('.cm-lineMarkGutter')
          ?.parentElement?.setAttribute('aria-hidden', 'true');
      },
    };
  });

  class Marker extends GutterMarker {
    constructor(
      readonly line: number,
      readonly kind: LineMark['kind'] | undefined,
      readonly focused: boolean,
    ) {
      super();
    }
    eq(other: Marker) {
      return (
        this.line === other.line &&
        this.kind === other.kind &&
        this.focused === other.focused
      );
    }
    toDOM(view: EditorView) {
      const button = view.dom.ownerDocument.createElement('button');
      button.type = 'button';
      button.popover = 'manual';
      button.tabIndex = -1;
      button.className = 'cm-lineMarkMarker';
      button.dataset.markLine = String(this.line);
      button.setAttribute('aria-haspopup', 'menu');
      button.setAttribute('aria-expanded', 'false');
      const name =
        [this.kind && labels[this.kind], this.focused && labels.focus]
          .filter(Boolean)
          .join(' + ') || labels.unmarked;
      button.setAttribute('aria-label', `${labels.line(this.line)}: ${name}`);
      const glyph = button.appendChild(
        view.dom.ownerDocument.createElement('span'),
      );
      glyph.setAttribute('aria-hidden', 'true');
      glyph.className = `cm-lineMarkGlyph cm-lineMarkGlyph-${this.kind ?? (this.focused ? 'focus' : 'empty')}`;
      glyph.textContent =
        this.kind === 'added' ? '+' : this.kind === 'removed' ? '−' : '';
      if (this.kind && this.focused) {
        const dot = button.appendChild(
          view.dom.ownerDocument.createElement('span'),
        );
        dot.className = 'cm-lineMarkFocusDot';
        dot.setAttribute('aria-hidden', 'true');
      }
      button.onmousedown = event => event.preventDefault();
      button.onkeydown = event =>
        view.plugin(menuPlugin)?.keyDown(event, this.line);
      button.onblur = event => view.plugin(menuPlugin)?.blurred(event);
      button.onclick = event =>
        view.plugin(menuPlugin)?.open(this.line, event.detail === 0);
      return button;
    }
  }
  return [
    menuPlugin,
    Prec.highest(
      gutter({
        class: 'cm-lineMarkGutter',
        lineMarker(view, line) {
          if (view.state.readOnly) return null;
          const number = view.state.doc.lineAt(line.from).number;
          const value = view.state.field(lineMarksField);
          let kind: LineMark['kind'] | undefined;
          let focused = false;
          value.decorations.between(
            line.from,
            line.from,
            (_from, _to, decoration) => {
              kind = decoration.spec.attributes['data-mark'];
            },
          );
          value.focused.between(line.from, line.from, () => {
            focused = true;
          });
          return new Marker(number, kind, focused);
        },
        lineMarkerChange: update =>
          update.startState.field(lineMarksField) !==
            update.state.field(lineMarksField) ||
          update.startState.readOnly !== update.state.readOnly,
      }),
    ),
  ];
}
