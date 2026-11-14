import type {Accessor} from 'solid-js';
import {createMemo, createSignal, onCleanup, onMount, Show} from 'solid-js';
import {getWhatsNew, RELEASES} from '../../state/whats-new';
import {Nudge} from './Nudge';
import {Showcase} from './Showcase';

export function WhatsNewHost(props: {
  quiet?: Accessor<boolean>;
  located?: boolean;
}) {
  const news = getWhatsNew();
  const [quiet, setQuiet] = createSignal(false);
  const forced = import.meta.env.DEV
    ? new URLSearchParams(location.search).get('whatsNew')
    : null;
  const [review, setReview] = createSignal(
    forced === 'nudge' || forced === 'showcase'
      ? {surface: forced, release: RELEASES[0]}
      : null,
  );
  const canAnnounce = createMemo(() => quiet() && (props.quiet?.() ?? true));
  const announcement = news.announce(canAnnounce);
  const current = () => review() ?? announcement();
  const dismiss = () => {
    setReview(null);
    news.dismiss();
  };

  onMount(() => {
    let ready = false;
    const check = () =>
      setQuiet(
        ready &&
          ![
            ...document.querySelectorAll<HTMLElement>(
              '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [aria-haspopup]:not([aria-haspopup="false"])[aria-expanded="true"]',
            ),
          ].some(element => element.getClientRects().length > 0),
      );
    const observer = new MutationObserver(check);
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
    const timer = window.setTimeout(() => {
      ready = true;
      check();
    }, 700);
    onCleanup(() => {
      observer.disconnect();
      clearTimeout(timer);
    });
  });
  return (
    <Show when={current()}>
      {entry => (
        <Show
          when={entry().surface === 'nudge'}
          fallback={
            <Showcase
              release={
                RELEASES.find(release => release.id === entry().release.id) ??
                RELEASES[0]
              }
              dismiss={dismiss}
              located={!!props.located}
            />
          }
        >
          <Nudge
            release={
              RELEASES.find(release => release.id === entry().release.id) ??
              RELEASES[0]
            }
            dismiss={dismiss}
            located={!!props.located}
          />
        </Show>
      )}
    </Show>
  );
}
