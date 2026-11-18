import {ViewPlugin} from '@codemirror/view';
import type {EditorView} from '@codemirror/view';
import {createCompartmentExtension} from 'solid-codemirror';
import type {Accessor} from 'solid-js';
import {createEffect} from 'solid-js';
import {useWatermarkScope} from './scope';

/** Makes a live editor the watermark's code source, measured by CodeMirror. */
export function createWatermarkCodeSource(
  view: Accessor<EditorView | undefined>,
) {
  const scope = useWatermarkScope();
  if (!scope) return;
  createEffect(view, current => {
    if (current)
      return scope.attach('code', {kind: 'codemirror', view: current});
  });
  createCompartmentExtension(
    ViewPlugin.define(() => ({
      update(update) {
        if (update.geometryChanged || update.viewportChanged)
          scope.invalidate();
      },
      docViewUpdate: scope.invalidate,
    })),
    view,
  );
}
