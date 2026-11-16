import {GutterMarker, type EditorView} from '@codemirror/view';
import type {LineMark} from '@codeimage/store/editor/model';
import type {LineMarkLabels} from './commands';
import type {LineMarkPlacement} from './placement';
import {keyDown} from './gutter-navigation';
import {gutterAction, gutterState} from './gutter-state';

export interface MarkerOptions {
  line: number;
  kind: LineMark['kind'] | undefined;
  focused: boolean;
  hovered: boolean;
  active: boolean;
  keyboardFocus: boolean;
  open: boolean;
  news: boolean;
}

export class Marker extends GutterMarker {
  constructor(
    readonly options: MarkerOptions,
    readonly environment: {
      labels: LineMarkLabels;
      placement: LineMarkPlacement;
    },
  ) {
    super();
  }
  get line() {
    return this.options.line;
  }
  eq(other: Marker) {
    return (
      this.line === other.line &&
      this.options.kind === other.options.kind &&
      this.options.focused === other.options.focused &&
      this.options.hovered === other.options.hovered &&
      this.options.active === other.options.active &&
      this.options.keyboardFocus === other.options.keyboardFocus &&
      this.options.open === other.options.open &&
      this.options.news === other.options.news
    );
  }
  toDOM(view: EditorView) {
    const slot = view.dom.ownerDocument.createElement('span');
    slot.className = 'cm-lineMarkSlot';
    let map = this.environment.placement.slots.get(view);
    if (!map) this.environment.placement.slots.set(view, (map = new Map()));
    map.set(this.line, slot);
    return slot;
  }
  control(view: EditorView) {
    const button = view.dom.ownerDocument.createElement('button');
    button.type = 'button';
    button.tabIndex = -1;
    button.className = 'cm-lineMarkMarker';
    button.dataset.markLine = String(this.line);
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', String(this.options.open));
    button.toggleAttribute('data-hovered', this.options.hovered);
    button.toggleAttribute('data-active', this.options.active);
    const name =
      [
        this.options.kind && this.environment.labels[this.options.kind],
        this.options.focused && this.environment.labels.focus,
      ]
        .filter(Boolean)
        .join(' + ') || this.environment.labels.unmarked;
    button.setAttribute(
      'aria-label',
      `${this.environment.labels.line(this.line)}: ${name}`,
    );
    const glyph = button.appendChild(
      view.dom.ownerDocument.createElement('span'),
    );
    glyph.setAttribute('aria-hidden', 'true');
    glyph.className = `cm-lineMarkGlyph cm-lineMarkGlyph-${this.options.kind ?? (this.options.focused ? 'focus' : 'empty')}`;
    glyph.textContent = {added: '+', removed: '−', highlight: '', empty: ''}[
      this.options.kind ?? 'empty'
    ];
    if (this.options.kind && this.options.focused) {
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
      getCoords: () =>
        this.environment.placement.besideLine(view, this.line, 20),
      mount: () => {
        if (!this.options.keyboardFocus || this.options.open) return;
        queueMicrotask(() => {
          const state = view.state.field(gutterState, false);
          if (dom.isConnected && state?.focused === this.line && !state.open)
            button.focus({preventScroll: true});
        });
      },
    };
  }
}
