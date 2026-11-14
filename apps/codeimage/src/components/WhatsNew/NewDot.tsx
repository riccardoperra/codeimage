import {Button} from '@codeui/kit';
import {Popover} from '@kobalte/core/popover';
import {createSignal, onCleanup, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import type {LocatedHighlightId} from '../../state/whats-new';
import {getWhatsNew, RELEASES} from '../../state/whats-new';
import {illustrations} from './illustrations';
import {duration, fromKeyboard} from './motion';
import * as styles from './whats-new.css';

const TABBABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function tabbableBeside(
  from: Element,
  side: 'before' | 'after',
  skip?: Element,
): HTMLElement | undefined {
  const position =
    side === 'before'
      ? Node.DOCUMENT_POSITION_PRECEDING
      : Node.DOCUMENT_POSITION_FOLLOWING;
  const candidates = [
    ...document.querySelectorAll<HTMLElement>(TABBABLE),
  ].filter(
    element =>
      !from.contains(element) &&
      !skip?.contains(element) &&
      from.compareDocumentPosition(element) & position &&
      element.getClientRects().length > 0,
  );
  return side === 'before' ? candidates.at(-1) : candidates[0];
}

export function NewDot(props: {highlight: LocatedHighlightId}) {
  const news = getWhatsNew();
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
  const toggle = (value: boolean, side: 'before' | 'after' = 'before') => {
    if (value === open()) return;
    if (value) {
      // Open before marking seen, or the dot unmounts for a moment and comes
      // back as a new element, without its fade.
      setOpen(true);
      news.opened(props.highlight, 'coachmark');
      news.seen(props.highlight);
      return;
    }
    if (anchor && !news.hasDot(props.highlight))
      returnTo = tabbableBeside(anchor, side, content);
    clearTimeout(closed);
    setClosing(!instant());
    closed = window.setTimeout(() => setClosing(false), duration.coachmarkOut);
    setOpen(false);
    returnTo?.focus();
  };
  const highlight = () =>
    RELEASES.flatMap(release => release.highlights).find(
      item => item.id === props.highlight,
    );
  return (
    <Show when={highlight()}>
      {item => (
        <Show when={news.hasDot(props.highlight) || open() || closing()}>
          <span
            ref={element => {
              anchor = element;
            }}
            class={styles.dotAnchor}
            data-news-dot={props.highlight}
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
                data-seen={!news.hasDot(props.highlight) ? '' : undefined}
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
