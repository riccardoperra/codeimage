import {Button} from '@codeui/kit';
import {Popover} from '@kobalte/core/popover';
import type {JSX} from 'solid-js';
import {batch, createSignal, onCleanup, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import type {LocatedHighlightId, Where} from '../../state/whats-new';
import {getWhatsNew, RELEASES} from '../../state/whats-new';
import {tabbableBeside} from './focus';
import {illustrations} from './illustrations';
import {duration, fromKeyboard} from './motion';
import * as styles from './whats-new.css';

type NewDotProps =
  | {at: Where; children?: undefined; filled?: undefined}
  | {at: Where; children: JSX.Element; filled?: boolean};

export function NewDot(props: NewDotProps) {
  return (
    // Testing the value would build the control a second time.
    <Show when={'children' in props} fallback={<Dot at={props.at} />}>
      <span
        class={`${styles.commandAnchor} ${props.filled ? styles.filledAnchor : ''}`}
      >
        {props.children}
        <Dot at={props.at} />
      </span>
    </Show>
  );
}

function Dot(props: {at: Where}) {
  const news = getWhatsNew();
  const [pinned, setPinned] = createSignal<LocatedHighlightId>();
  const current = () => pinned() ?? news.dotAt(props.at);
  let anchor: HTMLSpanElement | undefined;
  let content: HTMLDivElement | undefined;
  // A seen dot leaves with its coachmark, so focus cannot return to it.
  // The popover unmounts with the dot, before its own close focus can run.
  let returnTo: HTMLElement | undefined;
  const [open, setOpen] = createSignal(false);
  // A coachmark opened or closed from the keyboard appears and goes at once.
  const [instant, setInstant] = createSignal(false);
  // The dot stays mounted while its coachmark shrinks back into it.
  const [closing, setClosing] = createSignal(false);
  let closed: number | undefined;
  onCleanup(() => clearTimeout(closed));
  const toggle = (value: boolean, side?: 'before' | 'after') => {
    if (value === open()) return;
    if (value) {
      // Open before marking seen, or the dot unmounts for a moment and comes
      // back as a new element, without its fade.
      const id = current();
      if (!id) return;
      clearTimeout(closed);
      setClosing(false);
      setPinned(id);
      setOpen(true);
      news.opened(id, 'coachmark');
      news.seen(id);
      return;
    }
    if (anchor && (side !== undefined || !news.dotAt(props.at)))
      returnTo = tabbableBeside(anchor, side ?? 'before', content);
    clearTimeout(closed);
    const unpin = () =>
      batch(() => {
        setPinned(undefined);
        setClosing(false);
      });
    // Keyboard closes have no exit animation to keep the trigger mounted.
    batch(() => {
      setClosing(!instant());
      setOpen(false);
      if (instant()) unpin();
      else closed = window.setTimeout(unpin, duration.coachmarkOut);
    });
    returnTo?.focus();
  };
  const highlight = () =>
    RELEASES.flatMap(release => release.highlights).find(
      item => item.id === current(),
    );
  return (
    <Show when={highlight()}>
      {item => (
        <Show when={news.dotAt(props.at) === current() || open() || closing()}>
          <span
            ref={element => {
              anchor = element;
            }}
            class={styles.dotAnchor}
            data-news-dot={current()}
          >
            <Popover
              open={open()}
              onOpenChange={toggle}
              placement="bottom-start"
              gutter={10}
            >
              <Popover.Trigger
                class={styles.dot}
                onClick={(event: MouseEvent) => setInstant(fromKeyboard(event))}
                data-instant={instant() ? '' : undefined}
                aria-label={`New: ${item().title}`}
                data-seen={news.dotAt(props.at) !== current() ? '' : undefined}
              />
              <Popover.Portal
                mount={
                  anchor?.closest<HTMLElement>(
                    '[role="dialog"], [role="alertdialog"]',
                  ) ?? document.body
                }
              >
                <Popover.Content
                  ref={content}
                  class={styles.coachmark}
                  data-instant={instant() ? '' : undefined}
                  onEscapeKeyDown={() => setInstant(true)}
                  onPointerDownOutside={() => setInstant(false)}
                  // The coachmark is portaled away from its dot, so Tab would
                  // otherwise leave it for the end of the page.
                  onKeyDown={(event: KeyboardEvent) => {
                    if (event.key !== 'Tab') return;
                    event.preventDefault();
                    setInstant(true);
                    toggle(false, event.shiftKey ? 'before' : 'after');
                  }}
                  onCloseAutoFocus={event => {
                    if (!returnTo) return;
                    event.preventDefault();
                    returnTo.focus();
                    returnTo = undefined;
                  }}
                >
                  <Dynamic component={illustrations[item().id]} />
                  <div class={styles.copy}>
                    <Popover.Title class={styles.title}>
                      {item().title}
                    </Popover.Title>
                    <Popover.Description class={styles.body}>
                      {item().body}
                    </Popover.Description>
                  </div>
                  <div class={styles.actions}>
                    <span class={styles.steps} />
                    <Button
                      size="sm"
                      theme="secondary"
                      onClick={event => {
                        setInstant(fromKeyboard(event));
                        toggle(false);
                      }}
                    >
                      Got it
                    </Button>
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover>
          </span>
        </Show>
      )}
    </Show>
  );
}
