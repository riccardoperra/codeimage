import type {EditorState, Extension} from '@codemirror/state';
import {StateEffect, StateField} from '@codemirror/state';
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
  keymap,
  showTooltip,
  tooltips,
  ViewPlugin,
} from '@codemirror/view';
import type {LineMark} from '../../../../state/editor/model';
import {clearLineMark, lineMarksField, markLines, readMarks} from './state';

export interface LineMarkLabels {
  toolbar: string;
  highlight: string;
  added: string;
  removed: string;
  clear: string;
  focus: string;
  focusHint: string;
  clearMark: Record<LineMark['kind'] | 'focus', string>;
}

export const markCommands: {
  id: 'highlight' | 'added' | 'removed' | 'focus' | 'clear';
  key: string;
  kind: LineMark['kind'] | 'focus' | null;
}[] = [
  {id: 'highlight', key: 'Mod-Alt-1', kind: 'highlight'},
  {id: 'added', key: 'Mod-Alt-2', kind: 'added'},
  {id: 'removed', key: 'Mod-Alt-3', kind: 'removed'},
  {id: 'focus', key: 'Mod-Alt-4', kind: 'focus'},
  {id: 'clear', key: 'Mod-Alt-0', kind: null},
];

const isApple = () =>
  /Mac|iPhone|iPad/.test(globalThis.navigator?.platform ?? '');

/** Key caps for a `Mod-Alt-N` binding, as the platform prints them. */
export function shortcutKeys(key: string): string[] {
  const digit = key.slice(-1);
  return isApple() ? ['⌘', '⌥', digit] : ['Ctrl', 'Alt', digit];
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
  run: view => markLines(view, selectedLines(view.state), kind),
  preventDefault: true,
}));

const pointerSelecting = StateEffect.define<boolean>();

interface SelectionBar {
  pointer: boolean;
  tooltip: Tooltip | null;
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
    for (const command of markCommands) {
      const keys = shortcutKeys(command.key);
      const element = button(
        labels[command.id],
        `${command.id === 'focus' ? labels.focusHint : labels[command.id]} (${keys.join(isApple() ? '' : '+')})`,
        () => markLines(view, selectedLines(view.state), command.kind),
      );
      element.setAttribute(
        'aria-keyshortcuts',
        `${isApple() ? 'Meta' : 'Control'}+Alt+${command.key.slice(-1)}`,
      );
    }
    const syncVisibility = () => {
      dom.style.visibility = view.hasFocus ? '' : 'hidden';
    };
    syncVisibility();
    return {
      dom,
      offset: {x: 0, y: 4},
      update: () => syncVisibility(),
    };
  };
}

/**
 * Shows the toolbar above the first selected line once a selection settles,
 * hidden while the mouse button is held and while the editor is blurred.
 */
function selectionBar(labels: LineMarkLabels): Extension {
  const create = toolbarView(labels);
  const field = StateField.define<SelectionBar>({
    create: () => ({pointer: false, tooltip: null}),
    update(value, tr) {
      let {pointer} = value;
      for (const effect of tr.effects)
        if (effect.is(pointerSelecting)) pointer = effect.value;
      const range = tr.state.selection.main;
      if (pointer || range.empty || tr.state.readOnly)
        return {pointer, tooltip: null};
      const pos = tr.state.doc.lineAt(range.from).from;
      const tooltip =
        value.tooltip?.pos === pos
          ? value.tooltip
          : {pos, above: true, strictSide: false, create};
      return {pointer, tooltip};
    },
    provide: field =>
      showTooltip.compute([field], state => state.field(field).tooltip),
  });
  // Touch selection uses native handles, so only a held mouse button hides the bar.
  const pointerTracker = ViewPlugin.define(view => {
    const press = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button === 0)
        view.dispatch({effects: pointerSelecting.of(true)});
    };
    const release = () => {
      if (view.state.field(field).pointer)
        view.dispatch({effects: pointerSelecting.of(false)});
    };
    const doc = view.dom.ownerDocument;
    view.contentDOM.addEventListener('pointerdown', press);
    doc.addEventListener('pointerup', release);
    return {
      destroy: () => {
        view.contentDOM.removeEventListener('pointerdown', press);
        doc.removeEventListener('pointerup', release);
      },
    };
  });
  return [
    field,
    pointerTracker,
    // The code window clips its overflow and is scaled on small screens.
    tooltips({
      parent: document.body,
      tooltipSpace: view => {
        const {innerWidth, innerHeight} = view.dom.ownerDocument.defaultView!;
        return {
          left: 8,
          top: 8,
          right: innerWidth - 8,
          bottom: innerHeight - 8,
        };
      },
    }),
  ];
}

const hoverLine = StateEffect.define<number | null>();

function inlineClear(labels: LineMarkLabels): Extension {
  const create =
    (line: number) =>
    (view: EditorView): TooltipView => {
      const dom = document.createElement('div');
      dom.className = 'cm-lineMarkToolbar cm-lineMarkClear';
      dom.setAttribute('role', 'toolbar');
      dom.setAttribute('aria-label', labels.clear);
      dom.addEventListener('mousedown', event => event.preventDefault());
      const marks = readMarks(view.state);
      const kinds: (LineMark['kind'] | 'focus')[] = marks.lines
        .filter(mark => mark.line === line)
        .map(mark => mark.kind);
      if (marks.focusedLines.includes(line)) kinds.push('focus');
      for (const kind of kinds) {
        const button = dom.appendChild(document.createElement('button'));
        button.type = 'button';
        button.textContent = `${labels[kind]} ×`;
        button.setAttribute('aria-label', labels.clearMark[kind]);
        button.onclick = () => {
          clearLineMark(view, line, kind);
          view.focus();
        };
      }
      const syncVisibility = () => {
        dom.style.visibility =
          view.hasFocus || view.state.field(field).hover === line
            ? ''
            : 'hidden';
      };
      dom.addEventListener('mouseleave', () => {
        if (view.state.field(field).hover !== null)
          view.dispatch({effects: hoverLine.of(null)});
      });
      syncVisibility();
      return {dom, offset: {x: 0, y: 4}, update: syncVisibility};
    };
  const field = StateField.define<{
    hover: number | null;
    typing: boolean;
    tooltip: Tooltip | null;
  }>({
    create: () => ({hover: null, typing: false, tooltip: null}),
    update(value, tr) {
      let {hover, typing} = value;
      if (tr.docChanged) {
        hover = null;
        typing = true;
      } else if (tr.selection) typing = false;
      for (const effect of tr.effects) {
        if (effect.is(hoverLine)) {
          hover = effect.value;
          typing = false;
        }
      }
      const selection = tr.state.selection.main;
      const line =
        hover ??
        (!typing && selection.empty
          ? tr.state.doc.lineAt(selection.head).number
          : null);
      if (
        !line ||
        line > tr.state.doc.lines ||
        !selection.empty ||
        tr.state.readOnly
      )
        return {hover, typing, tooltip: null};
      const marks = readMarks(tr.state);
      if (
        !marks.lines.some(mark => mark.line === line) &&
        !marks.focusedLines.includes(line)
      )
        return {hover, typing, tooltip: null};
      const pos = tr.state.doc.line(line).to;
      if (
        value.tooltip?.pos === pos &&
        tr.startState.field(lineMarksField) === tr.state.field(lineMarksField)
      )
        return {...value, hover, typing};
      return {
        hover,
        typing,
        tooltip: {
          pos,
          above: true,
          strictSide: false,
          create: create(line),
        },
      };
    },
    provide: field =>
      showTooltip.compute([field], state => state.field(field).tooltip),
  });
  const tracker = ViewPlugin.define(view => {
    const move = (event: MouseEvent) => {
      const pos = view.posAtCoords({x: event.clientX, y: event.clientY});
      const line = pos === null ? null : view.state.doc.lineAt(pos).number;
      if (view.state.field(field).hover !== line)
        view.dispatch({effects: hoverLine.of(line)});
    };
    const leave = (event: MouseEvent) => {
      if (
        event.relatedTarget instanceof Element &&
        event.relatedTarget.closest('.cm-lineMarkClear')
      )
        return;
      if (view.state.field(field).hover !== null)
        view.dispatch({effects: hoverLine.of(null)});
    };
    view.contentDOM.addEventListener('mousemove', move);
    view.contentDOM.addEventListener('mouseleave', leave);
    return {
      destroy() {
        view.contentDOM.removeEventListener('mousemove', move);
        view.contentDOM.removeEventListener('mouseleave', leave);
      },
    };
  });
  return [field, tracker];
}

type GutterPreview = {from: number; to: number; kind: LineMark['kind'] | null};

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
  provide: field => EditorView.decorations.from(field),
});

export function gutterMarkMouseDown(
  view: EditorView,
  line: BlockInfo,
  event: Event,
): boolean {
  if (!(event instanceof MouseEvent)) return false;
  if (view.state.readOnly || event.button !== 0) return false;
  if (!view.state.field(gutterPreviewField, false)) return false;
  event.preventDefault();
  const start = view.state.doc.lineAt(line.from).number;
  const kind = readMarks(view.state).lines.some(
    mark => mark.line === start && mark.kind === 'highlight',
  )
    ? null
    : 'highlight';
  let end = start;
  const preview = () =>
    view.dispatch({
      effects: setGutterPreview.of({
        from: Math.min(start, end),
        to: Math.max(start, end),
        kind,
      }),
    });
  const move = (moveEvent: MouseEvent) => {
    const pos = view.posAtCoords({
      x: view.contentDOM.getBoundingClientRect().left + 1,
      y: moveEvent.clientY,
    });
    if (pos === null) return;
    const next = view.state.doc.lineAt(pos).number;
    if (next === end) return;
    end = next;
    preview();
  };
  const up = () => {
    window.removeEventListener('mousemove', move);
    window.removeEventListener('mouseup', up);
    window.removeEventListener('blur', up);
    view.dispatch({effects: setGutterPreview.of(null)});
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
  preview();
  return true;
}

const controlsTheme = EditorView.theme({
  '.cm-lineNumbers .cm-gutterElement': {cursor: 'pointer', borderRadius: '4px'},
  '.cm-lineNumbers .cm-gutterElement:hover': {backgroundColor: '#8883'},
  // The preview has to win over any mark it is about to replace.
  '.cm-line[data-mark-preview="highlight"]': {
    background:
      'var(--codeimage-line-highlight, rgba(128, 128, 128, 0.16)) !important',
    boxShadow:
      'inset 2px 0 var(--codeimage-line-accent, currentColor) !important',
  },
  '.cm-line[data-mark-preview="clear"]': {
    background: 'none !important',
    boxShadow: 'none !important',
  },
  '.cm-tooltip.cm-lineMarkToolbar': {
    display: 'flex',
    flexWrap: 'wrap',
    maxWidth: 'calc(100vw - 16px)',
    gap: '2px',
    padding: '3px',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontSize: '12px',
    lineHeight: '1',
    boxShadow: '0 4px 16px #0005',
    animation: 'cm-lineMarkToolbar-in 120ms ease-out',
  },
  '.cm-tooltip.cm-lineMarkClear': {animation: 'none'},
  '@keyframes cm-lineMarkToolbar-in': {
    from: {opacity: 0, transform: 'translateY(2px)'},
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
  '.cm-lineMarkToolbar button:focus-visible': {
    outline: '2px solid currentColor',
    outlineOffset: '-2px',
  },
  '@media (pointer: coarse)': {
    '.cm-lineMarkToolbar button': {padding: '10px 12px'},
  },
  '@media (prefers-reduced-motion: reduce)': {
    '.cm-tooltip.cm-lineMarkToolbar': {animation: 'none'},
  },
});

export function lineMarkControls(labels: LineMarkLabels): Extension {
  return [
    selectionBar(labels),
    inlineClear(labels),
    gutterPreviewField,
    controlsTheme,
    keymap.of(lineMarkKeymap),
  ];
}
