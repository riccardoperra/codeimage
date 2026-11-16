import {
  Prec,
  StateEffect,
  StateField,
  type EditorState,
  type Extension,
} from '@codemirror/state';
import {
  EditorView,
  gutter,
  GutterMarker,
  runScopeHandlers,
  showTooltip,
  ViewPlugin,
  type Tooltip,
  type BlockInfo,
} from '@codemirror/view';
import type {LineMarkLabels} from './controls';
import {
  lineAtHeight,
  markCommands,
  selectedLines,
  selectionFocus,
  shortcutKeys,
} from './controls';
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
      const action = effect.value;
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
    return next;
  },
});

export function gutterMarkHover(
  view: EditorView,
  _line: BlockInfo,
  event: Event,
): boolean {
  if (!(event instanceof PointerEvent) || event.pointerType !== 'mouse')
    return false;
  const ui = view.state.field(gutterState);
  if (ui.open) return false;
  const line = lineAtHeight(view, event.clientY);
  if (line !== ui.hovered)
    view.dispatch({effects: gutterAction.of({kind: 'hover', line})});
  return false;
}

export function gutterMarkLeave(
  view: EditorView,
  _line: BlockInfo,
  event: Event,
): boolean {
  if (!(event instanceof PointerEvent)) return false;
  const next = event.relatedTarget;
  if (next instanceof Node && view.dom.contains(next)) return false;
  if (
    next instanceof Element &&
    next.closest('.cm-lineMarkControl, .cm-lineMarkMenu')
  )
    return false;
  const ui = view.state.field(gutterState);
  if (!ui.open && ui.hovered !== null)
    view.dispatch({effects: gutterAction.of({kind: 'hover', line: null})});
  return false;
}

function keyDown(view: EditorView, event: KeyboardEvent, line: number) {
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
  }
}

export function lineMarkGutter(
  labels: LineMarkLabels,
  mountNews?: (host: HTMLElement) => () => void,
): Extension {
  const slots = new WeakMap<EditorView, Map<number, HTMLElement>>();
  const rectFor = (view: EditorView, line: number) => {
    const slot = slots.get(view)?.get(line);
    const rect = slot?.isConnected ? slot.getBoundingClientRect() : undefined;
    if (rect) return rect;
    const coords = view.coordsAtPos(view.state.doc.line(line).from);
    return coords ?? {left: -10000, right: -10000, top: -10000, bottom: -10000};
  };
  class Marker extends GutterMarker {
    constructor(
      readonly line: number,
      readonly kind: LineMark['kind'] | undefined,
      readonly focused: boolean,
      readonly hovered: boolean,
      readonly active: boolean,
      readonly tabStop: boolean,
      readonly keyboardFocus: boolean,
      readonly open: boolean,
      readonly news: boolean,
    ) {
      super();
    }
    eq(other: Marker) {
      return (
        this.line === other.line &&
        this.kind === other.kind &&
        this.focused === other.focused &&
        this.hovered === other.hovered &&
        this.active === other.active &&
        this.tabStop === other.tabStop &&
        this.keyboardFocus === other.keyboardFocus &&
        this.open === other.open &&
        this.news === other.news
      );
    }
    toDOM(view: EditorView) {
      const slot = view.dom.ownerDocument.createElement('span');
      slot.className = 'cm-lineMarkSlot';
      let map = slots.get(view);
      if (!map) slots.set(view, (map = new Map()));
      map.set(this.line, slot);
      return slot;
    }
    control(view: EditorView) {
      const button = view.dom.ownerDocument.createElement('button');
      button.type = 'button';
      button.tabIndex = this.tabStop ? 0 : -1;
      button.className = 'cm-lineMarkMarker';
      button.dataset.markLine = String(this.line);
      button.setAttribute('aria-haspopup', 'menu');
      button.setAttribute('aria-expanded', String(this.open));
      button.toggleAttribute('data-hovered', this.hovered);
      button.toggleAttribute('data-active', this.active);
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
      button.onkeydown = event => keyDown(view, event, this.line);
      button.onfocus = () => {
        if (view.state.field(gutterState).focused !== this.line)
          view.dispatch({
            effects: gutterAction.of({kind: 'focus', line: this.line}),
          });
      };
      button.onclick = event => {
        if (view.state.readOnly) return;
        const open = view.state.field(gutterState).open;
        view.dispatch({
          effects: gutterAction.of({
            kind: 'menu',
            open:
              open?.line === this.line
                ? null
                : {line: this.line, keyboard: event.detail === 0},
          }),
        });
      };

      const dom = view.dom.ownerDocument.createElement('div');
      dom.className = 'cm-lineMarkControl';
      dom.appendChild(button);
      dom.onpointerleave = event => {
        const next = event.relatedTarget;
        const ui = view.state.field(gutterState);
        if (ui.open || ui.hovered === null) return;
        if (next instanceof Node && view.dom.contains(next)) return;
        if (
          next instanceof Element &&
          next.closest('.cm-lineMarkControl, .cm-lineMarkMenu')
        )
          return;
        view.dispatch({effects: gutterAction.of({kind: 'hover', line: null})});
      };
      return {
        dom,
        overlap: true,
        resize: false,
        getCoords: () => {
          const rect = rectFor(view, this.line);
          const top = (rect.top + rect.bottom - 24) / 2;
          return {left: rect.right - 20, right: rect.right, top, bottom: top};
        },
        mount: () => {
          if (!this.keyboardFocus || this.open) return;
          queueMicrotask(() => {
            const state = view.state.field(gutterState, false);
            if (dom.isConnected && state?.focused === this.line && !state.open)
              button.focus({preventScroll: true});
          });
        },
      };
    }
  }
  const markersFor = (state: EditorState) => {
    const ui = state.field(gutterState);
    const marks = readMarks(state);
    const cursor = state.doc.lineAt(state.selection.main.head).number;
    return [
      ...new Set([cursor, ui.hovered, ui.focused, ui.open?.line, ui.tabStop]),
    ]
      .filter(
        (line): line is number =>
          line != null && line >= 1 && line <= state.doc.lines,
      )
      .map(
        line =>
          new Marker(
            line,
            marks.lines.find(mark => mark.line === line)?.kind,
            marks.focusedLines.includes(line),
            line === ui.hovered,
            line === ui.active,
            line === ui.tabStop,
            line === ui.focused,
            line === ui.open?.line,
            ui.news && line === cursor,
          ),
      );
  };
  const markerTooltips = StateField.define<{
    markers: Marker[];
    tooltips: Tooltip[];
  }>({
    create: state => {
      const markers = markersFor(state);
      return {
        markers,
        tooltips: state.readOnly
          ? []
          : markers.map(marker => ({
              pos: state.doc.line(marker.line).from,
              strictSide: true,
              create: view => marker.control(view),
            })),
      };
    },
    update(value, tr) {
      if (tr.state.readOnly) return {markers: [], tooltips: []};
      const markers = markersFor(tr.state);
      const tooltips = markers.map(marker => {
        const index = value.markers.findIndex(previous => marker.eq(previous));
        return index < 0 || tr.docChanged
          ? {
              pos: tr.state.doc.line(marker.line).from,
              strictSide: true,
              create: (view: EditorView) => marker.control(view),
            }
          : value.tooltips[index];
      });
      return {markers, tooltips};
    },
    provide: field =>
      showTooltip.computeN([field], state => state.field(field).tooltips),
  });
  const createNews = (view: EditorView) => {
    const dom = view.dom.ownerDocument.createElement('div');
    dom.className = 'cm-lineMarkNews';
    const dispose = mountNews?.(dom);
    return {
      dom,
      overlap: true,
      getCoords: () => {
        const line = view.state.doc.lineAt(
          view.state.selection.main.head,
        ).number;
        const rect = rectFor(view, line);
        const top = (rect.top + rect.bottom - 24) / 2;
        return {left: rect.right - 46, right: rect.right, top, bottom: top};
      },
      destroy: () => dispose?.(),
    };
  };
  const newsField = StateField.define<Tooltip | null>({
    create: () => null,
    update(value, tr) {
      if (!tr.state.field(gutterState).news || tr.state.readOnly || !mountNews)
        return null;
      const pos = tr.state.doc.lineAt(tr.state.selection.main.head).from;
      return value?.pos === pos
        ? value
        : {pos, strictSide: true, create: createNews};
    },
    provide: field => showTooltip.from(field),
  });
  const menuField = StateField.define<Tooltip | null>({
    create: () => null,
    update(value, tr) {
      const open = tr.state.field(gutterState).open;
      if (!open) return null;
      if (open === tr.startState.field(gutterState).open) return value;
      return {
        pos: tr.state.doc.line(open.line).from,
        create: view => {
          const {line, keyboard} = open;
          const doc = view.dom.ownerDocument;
          const close = (restoreFocus = false) =>
            view.dispatch({
              effects: [
                gutterAction.of({kind: 'menu', open: null}),
                ...(restoreFocus
                  ? [gutterAction.of({kind: 'focus', line})]
                  : []),
              ],
            });
          const lines = menuLines(view.state, line);
          const marks = readMarks(view.state);
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
              toggleMark(view, lines, command.kind);
              close(true);
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

          const outside = (event: Event) => {
            if (!(event.target instanceof Node) || dom.contains(event.target))
              return;
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
              return {
                left: rect.right - 20,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
              };
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
        },
      };
    },
    provide: field => showTooltip.from(field),
  });
  return [
    gutterState,
    markerTooltips,
    newsField,
    menuField,
    EditorView.domEventHandlers({
      pointermove(event, view) {
        const ui = view.state.field(gutterState);
        if (ui.open || event.pointerType !== 'mouse') return;
        const line = lineAtHeight(view, event.clientY);
        if (line !== ui.hovered)
          view.dispatch({effects: gutterAction.of({kind: 'hover', line})});
      },
      pointerleave(event, view) {
        if (
          event.relatedTarget instanceof Element &&
          event.relatedTarget.closest('.cm-lineMarkControl, .cm-lineMarkMenu')
        )
          return;
        const ui = view.state.field(gutterState);
        if (!ui.open && ui.hovered !== null)
          view.dispatch({
            effects: gutterAction.of({kind: 'hover', line: null}),
          });
      },
    }),
    ViewPlugin.define(view => {
      const doc = view.dom.ownerDocument;
      let alive = true;
      const blur = () =>
        queueMicrotask(() => {
          if (!alive) return;
          const target = doc.activeElement;
          if (
            target instanceof Element &&
            target.closest('.cm-lineMarkControl, .cm-lineMarkMenu')
          )
            return;
          if (view.state.field(gutterState).focused !== null)
            view.dispatch({
              effects: gutterAction.of({kind: 'focus', line: null}),
            });
        });
      doc.addEventListener('focusin', blur);
      return {
        destroy: () => {
          alive = false;
          doc.removeEventListener('focusin', blur);
        },
      };
    }),
    Prec.highest(
      gutter({
        class: 'cm-lineMarkGutter',
        domEventHandlers: {
          pointermove: gutterMarkHover,
          pointerout: gutterMarkLeave,
        },
        lineMarker(view, line) {
          if (view.state.readOnly) return null;
          const number = view.state.doc.lineAt(line.from).number;
          return (
            view.state
              .field(markerTooltips)
              .markers.find(marker => marker.line === number) ??
            new Marker(
              number,
              undefined,
              false,
              false,
              false,
              false,
              false,
              false,
              false,
            )
          );
        },
        lineMarkerChange: update =>
          update.startState.field(gutterState) !==
            update.state.field(gutterState) ||
          update.startState.field(lineMarksField) !==
            update.state.field(lineMarksField) ||
          update.startState.readOnly !== update.state.readOnly,
      }),
    ),
  ];
}
