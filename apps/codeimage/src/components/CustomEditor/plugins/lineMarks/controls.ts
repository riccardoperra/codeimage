import type {EditorState, Extension} from '@codemirror/state';
import {Facet, RangeSet, StateEffect, StateField} from '@codemirror/state';
import type {
  BlockInfo,
  DecorationSet,
  KeyBinding,
  Tooltip,
  TooltipView,
} from '@codemirror/view';
import {
  Decoration,
  EditorView,
  GutterMarker,
  gutterLineClass,
  keymap,
  showTooltip,
  tooltips,
  ViewPlugin,
} from '@codemirror/view';
import {isApple} from '../../../../core/constants/platform';
import type {MarkKind} from './state';
import {hasMark, markLines, readMarks, toggleMark} from './state';

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

/** Key caps for a `Mod-Alt-N` binding, as the platform prints them. */
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

function toolbarSpace(view: EditorView) {
  const {innerWidth, innerHeight} = view.dom.ownerDocument.defaultView!;
  return {left: 8, top: 8, right: innerWidth - 8, bottom: innerHeight - 8};
}

function selectionToolbar(labels: LineMarkLabels): Extension {
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
    tooltips({parent: document.body, tooltipSpace: toolbarSpace}),
  ];
}

class PreviewClass extends GutterMarker {
  constructor(readonly elementClass: string) {
    super();
  }
}

const previewGutter = {
  highlight: new PreviewClass('cm-lineMarkPreview-highlight'),
  clear: new PreviewClass('cm-lineMarkPreview-clear'),
};

type GutterPreview = {from: number; to: number; kind: 'highlight' | null};

const setGutterPreview = StateEffect.define<GutterPreview | null>();

const gutterPreviewField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    value = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (!effect.is(setGutterPreview)) continue;
      const preview = effect.value;
      if (!preview) {
        value = Decoration.none;
        continue;
      }
      const decoration = Decoration.line({
        attributes: {'data-mark-preview': preview.kind ?? 'clear'},
      });
      const ranges = [];
      for (let line = preview.from; line <= preview.to; line++)
        ranges.push(decoration.range(tr.state.doc.line(line).from));
      value = Decoration.set(ranges);
    }
    return value;
  },
  provide: field => [
    EditorView.decorations.from(field),
    gutterLineClass.compute([field], state => {
      const markers = [];
      for (
        let cursor = state.field(field).iter();
        cursor.value;
        cursor.next()
      ) {
        const marker =
          cursor.value.spec.attributes['data-mark-preview'] === 'highlight'
            ? previewGutter.highlight
            : previewGutter.clear;
        markers.push(marker.range(cursor.from));
      }
      return RangeSet.of(markers);
    }),
  ],
});

export function lineAtHeight(view: EditorView, y: number): number {
  const height = Math.max(
    0,
    Math.min((y - view.documentTop) / view.scaleY, view.contentHeight),
  );
  const block = view.lineBlockAtHeight(height);
  return view.state.doc.lineAt(Math.min(block.from, view.state.doc.length))
    .number;
}

const gutterDrag = ViewPlugin.define(
  view => {
    let drag: {start: number; end: number; kind: 'highlight' | null} | null =
      null;
    const doc = view.dom.ownerDocument;
    const win = doc.defaultView!;
    const preview = () => {
      if (!drag) return;
      view.dispatch({
        effects: setGutterPreview.of({
          from: Math.min(drag.start, drag.end),
          to: Math.max(drag.start, drag.end),
          kind: drag.kind,
        }),
      });
    };
    const release = () => {
      if (!drag) return;
      const {start, end, kind} = drag;
      drag = null;
      view.dispatch({effects: setGutterPreview.of(null)});
      markLines(
        view,
        Array.from(
          {length: Math.abs(end - start) + 1},
          (_, i) => Math.min(start, end) + i,
        ),
        kind,
      );
      view.focus();
    };
    const cancel = () => {
      if (!drag) return;
      drag = null;
      view.dispatch({effects: setGutterPreview.of(null)});
    };
    doc.addEventListener('pointerup', release);
    doc.addEventListener('pointercancel', cancel);
    win.addEventListener('blur', release);
    return {
      start(line: BlockInfo, event: PointerEvent) {
        const start = view.state.doc.lineAt(line.from).number;
        drag = {
          start,
          end: start,
          kind: hasMark(readMarks(view.state), start, 'highlight')
            ? null
            : 'highlight',
        };
        view.contentDOM.setPointerCapture(event.pointerId);
        preview();
      },
      move(event: PointerEvent) {
        if (!drag) return;
        const next = lineAtHeight(view, event.clientY);
        if (next === drag.end) return;
        drag.end = next;
        preview();
      },
      destroy() {
        doc.removeEventListener('pointerup', release);
        doc.removeEventListener('pointercancel', cancel);
        win.removeEventListener('blur', release);
      },
    };
  },
  {
    eventHandlers: {
      pointermove(event) {
        this.move(event);
      },
    },
  },
);

export function gutterMarkPointerDown(
  view: EditorView,
  line: BlockInfo,
  event: Event,
): boolean {
  if (
    !(event instanceof PointerEvent) ||
    event.button !== 0 ||
    view.state.readOnly
  )
    return false;
  const drag = view.plugin(gutterDrag);
  if (!drag) return false;
  event.preventDefault();
  drag.start(line, event);
  return true;
}

const controlsTheme = EditorView.theme({
  '.cm-lineNumbers .cm-gutterElement': {cursor: 'pointer'},
  // An overlay, so hovering a number keeps the row's mark band underneath.
  '.cm-lineNumbers .cm-gutterElement:hover': {
    backgroundImage: 'linear-gradient(#8883, #8883)',
  },
  // The preview has to win over any mark it is about to replace.
  '.cm-line[data-mark-preview="highlight"], .cm-lineNumbers .cm-lineMarkPreview-highlight':
    {
      background:
        'var(--codeimage-line-highlight, rgba(128, 128, 128, 0.16)) !important',
      boxShadow:
        'inset 2px 0 var(--codeimage-line-accent, currentColor) !important',
    },
  '&[data-line-numbers="true"] .cm-line[data-mark-preview="highlight"]': {
    boxShadow: 'none !important',
  },
  '.cm-line[data-mark-preview="clear"], .cm-lineNumbers .cm-lineMarkPreview-clear':
    {
      background: 'none !important',
      boxShadow: 'none !important',
    },
  // App chrome, so it keeps one contrast-safe palette across syntax themes.
  '.cm-tooltip.cm-lineMarkToolbar': {
    display: 'flex',
    background: '#232326',
    color: '#f4f4f5',
    border: '1px solid #ffffff1f',
    flexWrap: 'wrap',
    maxWidth: 'calc(100vw - 16px)',
    gap: '2px',
    padding: '3px',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '12px',
    lineHeight: '1',
    boxShadow: '0 4px 16px #0005',
  },
  '.cm-lineMarkToolbar button': {
    border: '0',
    borderRadius: '5px',
    background: 'transparent',
    color: 'inherit',
    padding: '6px 8px',
    cursor: 'pointer',
    font: 'inherit',
    whiteSpace: 'nowrap',
  },
  '.cm-lineMarkToolbar button:hover': {background: '#8883'},
  '.cm-lineMarkToolbar button[aria-pressed="true"]': {background: '#8884'},
  '.cm-lineMarkToolbar button:focus-visible': {
    outline: '2px solid currentColor',
    outlineOffset: '-2px',
  },
  '@media (pointer: coarse)': {
    '.cm-lineMarkToolbar button': {padding: '10px 12px'},
  },
});

export function lineMarkControls(labels: LineMarkLabels): Extension {
  return [
    selectionToolbar(labels),
    gutterPreviewField,
    gutterDrag,
    controlsTheme,
    keymap.of(lineMarkKeymap),
  ];
}
