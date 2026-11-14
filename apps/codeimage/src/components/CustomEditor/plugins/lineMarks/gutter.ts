import {Prec, type EditorState, type Extension} from '@codemirror/state';
import {
  gutter,
  GutterMarker,
  runScopeHandlers,
  ViewPlugin,
  type EditorView,
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

export function lineMarkGutter(labels: LineMarkLabels): Extension {
  const menuPlugin = ViewPlugin.define(view => {
    let open: {dom: HTMLDivElement; line: number} | null = null;
    const doc = view.dom.ownerDocument;
    const win = doc.defaultView!;
    const markerFor = (line: number) =>
      view.dom.querySelector<HTMLButtonElement>(
        `.cm-lineMarkMarker[data-mark-line="${line}"]`,
      );
    let focusAfterMeasure: number | null = null;
    let hovered: HTMLButtonElement | null = null;
    const clearHover = () => {
      hovered?.removeAttribute('data-hovered');
      hovered = null;
    };
    const hoverLine = (event: PointerEvent) => {
      if (
        event.pointerType !== 'mouse' ||
        !win.matchMedia('(hover: hover) and (pointer: fine)').matches
      )
        return;
      const target = event.target;
      const line =
        target instanceof Element ? target.closest('.cm-line') : null;
      const marker = line
        ? markerFor(view.state.doc.lineAt(view.posAtDOM(line)).number)
        : target instanceof Element
          ? target.closest<HTMLButtonElement>('.cm-lineMarkMarker')
          : null;
      if (marker === hovered) return;
      clearHover();
      hovered = marker;
      hovered?.setAttribute('data-hovered', '');
    };
    view.dom.addEventListener('pointermove', hoverLine);
    view.dom.addEventListener('pointerleave', clearHover);
    const close = (restoreFocus = false) => {
      if (!open) return;
      const {dom, line} = open;
      open = null;
      dom.remove();
      const marker = markerFor(line);
      marker?.setAttribute('aria-expanded', 'false');
      if (restoreFocus) marker?.focus({preventScroll: true});
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
    doc.addEventListener('pointerdown', outside);
    doc.addEventListener('focusin', outside);
    win.addEventListener('resize', dismiss);
    win.addEventListener('scroll', dismiss, true);
    const exposeGutter = () =>
      view.requestMeasure({
        key: exposeGutter,
        read: () =>
          [
            ...view.dom.querySelectorAll<HTMLElement>(
              '.cm-lineMarkGutter .cm-gutterElement',
            ),
          ].flatMap(cell => {
            const button = cell.querySelector<HTMLButtonElement>('button');
            return button ? [{button, rect: cell.getBoundingClientRect()}] : [];
          }),
        write: markers => {
          // Top-layer controls keep a 20px target even when the canvas is scaled or clipped.
          view.dom
            .querySelector('.cm-lineMarkGutter')
            ?.parentElement?.removeAttribute('aria-hidden');
          for (const {button, rect} of markers) {
            if (rect.bottom < 0 || rect.top > win.innerHeight) {
              if (button.matches(':popover-open')) button.hidePopover();
              continue;
            }
            button.style.left = `${rect.right - 20}px`;
            button.style.top = `${rect.top}px`;
            button.style.height = `${rect.height}px`;
            if (!button.matches(':popover-open')) button.showPopover();
          }
          if (focusAfterMeasure !== null) {
            markerFor(focusAfterMeasure)?.focus({preventScroll: true});
            focusAfterMeasure = null;
          }
        },
      });
    exposeGutter();
    return {
      keyDown(event: KeyboardEvent, line: number) {
        if (
          (event.ctrlKey || event.metaKey) &&
          runScopeHandlers(view, event, 'editor')
        ) {
          event.preventDefault();
          event.stopPropagation();
          focusAfterMeasure = line;
          exposeGutter();
        }
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
            close();
            focusAfterMeasure = line;
            toggleMark(view, lines, command.kind);
            exposeGutter();
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
            close(true);
          } else if (
            ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
          ) {
            event.preventDefault();
            const next =
              event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? buttons.length - 1
                  : (index +
                      (event.key === 'ArrowDown' ? 1 : -1) +
                      buttons.length) %
                    buttons.length;
            buttons[next].focus();
          }
        };
        doc.body.appendChild(dom);
        dom.showPopover();
        const rect = anchor.getBoundingClientRect();
        const box = dom.getBoundingClientRect();
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
        buttons[0].focus({preventScroll: true});
      },
      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.selectionSet ||
          update.state.readOnly ||
          update.startState.field(lineMarksField) !==
            update.state.field(lineMarksField)
        )
          close();
        if (
          update.docChanged ||
          update.geometryChanged ||
          update.viewportChanged ||
          update.startState.field(lineMarksField) !==
            update.state.field(lineMarksField)
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
