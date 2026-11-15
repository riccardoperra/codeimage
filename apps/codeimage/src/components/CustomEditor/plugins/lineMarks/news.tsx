import type {Owner} from 'solid-js';
import {createSignal, Show} from 'solid-js';
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
    const measure = () =>
      view.requestMeasure({
        key: host,
        read: () => {
          const line = view.state.doc.lineAt(
            view.state.selection.main.head,
          ).number;
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
            .find(element => !element.closest('.cm-lineMarkMarker'));
          if (!top || !view.dom.contains(top)) return;
          return {left: Math.max(4, rect.right - 46), top: rect.top};
        },
        write: setPosition,
      });
    const dispose = render(
      () => {
        getWhatsNew().bindLocation('editor:line-marks', async () => {
          view.dispatch({
            effects: EditorView.scrollIntoView(view.state.selection.main.head, {
              y: 'nearest',
            }),
          });
          measure();
          await new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
        });
        return (
          <Show when={position()}>
            {point => (
              <div
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
    const changed = () => measure();
    window.addEventListener('resize', changed);
    window.addEventListener('scroll', changed, true);
    measure();
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
        measure();
      },
      destroy() {
        dispose();
        host.remove();
        window.removeEventListener('resize', changed);
        window.removeEventListener('scroll', changed, true);
      },
    };
  });
}
