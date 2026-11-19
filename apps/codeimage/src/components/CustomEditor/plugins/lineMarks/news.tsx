import type {Owner} from 'solid-js';
import {createRoot, runWithOwner} from 'solid-js';
import {render} from '@solidjs/web';
import {EditorView, ViewPlugin} from '@codemirror/view';
import {NewDot} from '../../../WhatsNew/NewDot';
import {getWhatsNew} from '../../../../state/whats-new';
import {gutterAction} from './gutter';

export function mountLineMarksNews(host: HTMLElement, owner: Owner) {
  host.dataset.lineMarksNews = '';
  return runWithOwner(owner, () =>
    render(() => <NewDot at="editor:line-marks" />, host),
  );
}

export function lineMarksNews(owner: Owner) {
  return ViewPlugin.define(view => {
    let alive = true;
    const dispose = runWithOwner(owner, () =>
      createRoot(dispose => {
        getWhatsNew().bindLocation('editor:line-marks', () => {
          view.dispatch({
            effects: EditorView.scrollIntoView(view.state.selection.main.head, {
              y: 'nearest',
            }),
          });
        });
        return dispose;
      }),
    );
    queueMicrotask(() => {
      if (alive)
        view.dispatch({effects: gutterAction.of({kind: 'news', value: true})});
    });
    return {
      update(update) {
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
        alive = false;
        dispose?.();
      },
    };
  });
}
