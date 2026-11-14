import type {Accessor} from 'solid-js';
import {createMemo, createSignal, onCleanup, Show} from 'solid-js';
import {getWhatsNew, RELEASES} from '../../state/whats-new';
import {Nudge} from './Nudge';
import {Showcase} from './Showcase';

const OPEN_POPUP =
  '[role="dialog"], [role="alertdialog"], [role="menu"], [aria-haspopup]:not([aria-haspopup="false"])[aria-expanded="true"]';

// Gives the editor a moment to settle before anything floats over it.
const SETTLE_MS = 700;

function watchQuiet(hostQuiet?: Accessor<boolean>): Accessor<boolean> {
  const [clear, setClear] = createSignal(false);
  let frame = 0;
  const check = () => {
    frame = 0;
    setClear(
      ![...document.querySelectorAll(OPEN_POPUP)].some(
        element => element.getClientRects().length > 0,
      ),
    );
  };
  const schedule = () => {
    frame ||= requestAnimationFrame(check);
  };
  const observer = new MutationObserver(schedule);
  const timer = window.setTimeout(() => {
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'aria-expanded',
        'hidden',
        'data-expanded',
        'data-closed',
        'style',
      ],
    });
    check();
  }, SETTLE_MS);
  onCleanup(() => {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    observer.disconnect();
  });
  const quiet = createMemo(() => clear() && (hostQuiet?.() ?? true));
  return quiet;
}

export function WhatsNewHost(props: {quiet?: Accessor<boolean>}) {
  const news = getWhatsNew();
  const forced = import.meta.env.DEV
    ? new URLSearchParams(location.search).get('whatsNew')
    : null;
  const reviewing = forced === 'nudge' || forced === 'showcase';
  const [review, setReview] = createSignal(
    reviewing ? {surface: forced, release: RELEASES[0]} : null,
  );
  // The store calls this inside its own effect, which tracks the result.
  // oxlint-disable-next-line solid/reactivity
  const announcement = news.announce(() => watchQuiet(props.quiet));
  const current = () => (reviewing ? review() : announcement());
  const dismiss = () => {
    setReview(null);
    news.dismiss();
  };

  return (
    <Show when={current()}>
      {entry => (
        <Show
          when={entry().surface === 'nudge'}
          fallback={<Showcase release={entry().release} dismiss={dismiss} />}
        >
          <Nudge release={entry().release} dismiss={dismiss} />
        </Show>
      )}
    </Show>
  );
}
