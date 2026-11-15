import {getRootEditorStore} from '@codeimage/store/editor';
import {Compartment, Prec, StateEffect} from '@codemirror/state';
import {getTooltip, showTooltip, tooltips} from '@codemirror/view';
import type {EditorView} from '@codemirror/view';
import {createEffect} from 'solid-js';

function toolbarSpace(view: EditorView) {
  const viewport = {
    left: 8,
    top: 8,
    right: innerWidth - 8,
    bottom: innerHeight - 8,
  };
  const toolbar = view.state
    .facet(showTooltip)
    .find(
      tooltip =>
        tooltip &&
        getTooltip(view, tooltip)?.dom.classList.contains('cm-lineMarkToolbar'),
    );
  if (!toolbar || !view.hasFocus) return viewport;
  const line = view.coordsAtPos(toolbar.pos);
  // CodeMirror remembers a tooltip's flipped side after zooming. Leaving
  // room below only for its anchor keeps the bar clear of the selected lines.
  return line
    ? {...viewport, bottom: Math.min(viewport.bottom, line.bottom + 4)}
    : viewport;
}

const placement = new Compartment();

export function keepMarkToolbarAboveSelection() {
  const editor = getRootEditorStore();
  createEffect(() => {
    const view = editor.activeEditorView();
    if (!view) return;
    queueMicrotask(() => {
      if (editor.activeEditorView() !== view) return;
      if (placement.get(view.state) !== undefined) return;
      view.dispatch({
        effects: StateEffect.appendConfig.of(
          placement.of(Prec.highest(tooltips({tooltipSpace: toolbarSpace}))),
        ),
      });
    });
  });
}
