import type {Owner} from 'solid-js';
import {createEffect, createSignal, onCleanup, Show} from 'solid-js';
import {render} from 'solid-js/web';
import type {ViewUpdate} from '@codemirror/view';
import {EditorView, ViewPlugin} from '@codemirror/view';
import {NewDot} from '../../../WhatsNew/NewDot';
import {getWhatsNew} from '../../../../state/whats-new';

/** The interactive plugin owns its badge outside the captured editor DOM. */
export function lineMarksNews(owner: Owner): ViewPlugin<{
  update: (update: ViewUpdate) => void;
  destroy: () => void;
}> {
  return ViewPlugin.define(view => {
    const host = document.body.appendChild(document.createElement('div'));
    const [position, setPosition] = createSignal<{left: number; top: number}>();
    const locate = () => {
      const line = view.state.doc.lineAt(view.state.selection.main.head).number;
      const marker = view.dom.querySelector<HTMLElement>(
        `.cm-lineMarkMarker[data-mark-line="${line}"]`,
      );
      const rect = marker?.parentElement?.getBoundingClientRect();
      if (!rect || rect.top < 0 || rect.bottom > innerHeight) return;
      const top = document
        .elementsFromPoint(
          (rect.left + rect.right) / 2,
          rect.top + rect.height / 2,
        )
        .find(
          element =>
            !element.closest('.cm-lineMarkMarker') && !host.contains(element),
        );
      if (!top || !view.dom.contains(top)) return;
      return {left: Math.max(4, rect.right - 46), top: rect.top};
    };
    const place = () => {
      const next = locate();
      const current = position();
      if (next?.left !== current?.left || next?.top !== current?.top)
        setPosition(next);
    };
    // The badge is fixed to the viewport, and the canvas moves for reasons no
    // event reports: a panel opening beside it, the inspector changing side,
    // a fit-to-screen transform. So while the dot can show, follow the marker
    // every frame. Nothing runs once the highlight is seen.
    let frame = 0;
    const follow = () => {
      frame = requestAnimationFrame(follow);
      place();
    };
    const dispose = render(
      () => {
        getWhatsNew().bindLocation('editor:line-marks', async () => {
          view.dispatch({
            effects: EditorView.scrollIntoView(view.state.selection.main.head, {
              y: 'nearest',
            }),
          });
          await new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          place();
        });
        createEffect(() => {
          const news = getWhatsNew();
          if (
            !news.dotAt('editor:line-marks') &&
            !news.revealedAt('editor:line-marks')
          )
            return;
          follow();
          onCleanup(() => cancelAnimationFrame(frame));
        });
        return (
          <Show when={position()}>
            {point => (
              <div
                data-line-marks-news
                style={{
                  position: 'fixed',
                  left: `${point().left}px`,
                  top: `${point().top}px`,
                  'z-index': 35,
                }}
              >
                <NewDot at="editor:line-marks" />
              </div>
            )}
          </Show>
        );
      },
      host,
      undefined,
      {owner},
    );
    return {
      update(update: ViewUpdate) {
        if (
          update.transactions.some(
            tr =>
              tr.isUserEvent('input.line-marks') ||
              tr.isUserEvent('input.annotations') ||
              tr.isUserEvent('input.diff-import'),
          )
        )
          getWhatsNew().seen('marks');
      },
      destroy() {
        cancelAnimationFrame(frame);
        dispose();
        host.remove();
      },
    };
  });
}
