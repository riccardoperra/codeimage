import {Button} from '@codeui/kit';
import {Popover} from '@kobalte/core/popover';
import {createSignal, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import type {LocatedHighlightId} from '../../state/whats-new';
import {getWhatsNew, RELEASES} from '../../state/whats-new';
import {illustrations} from './illustrations';
import * as styles from './whats-new.css';

const TABBABLE =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function previousTabbable(from: Element): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>(TABBABLE)]
    .filter(
      element =>
        !from.contains(element) &&
        element.compareDocumentPosition(from) &
          Node.DOCUMENT_POSITION_FOLLOWING &&
        element.getClientRects().length > 0,
    )
    .at(-1);
}

export function NewDot(props: {highlight: LocatedHighlightId}) {
  const news = getWhatsNew();
  let anchor: HTMLSpanElement | undefined;
  // A seen dot leaves with its coachmark, so focus cannot return to it.
  let returnTo: HTMLElement | undefined;
  const [open, setOpen] = createSignal(false);
  const toggle = (value: boolean) => {
    if (value) {
      news.opened(props.highlight, 'coachmark');
      news.seen(props.highlight);
    } else if (anchor && !news.hasDot(props.highlight)) {
      returnTo = previousTabbable(anchor);
    }
    setOpen(value);
  };
  const highlight = () =>
    RELEASES.flatMap(release => release.highlights).find(
      item => item.id === props.highlight,
    );
  return (
    <Show when={highlight()}>
      {item => (
        <Show when={news.hasDot(props.highlight) || open()}>
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
                  class={styles.coachmark}
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
                      onClick={() => toggle(false)}
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
