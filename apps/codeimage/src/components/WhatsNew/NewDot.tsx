import {Button} from '@codeui/kit';
import {Popover} from '@kobalte/core/popover';
import {createSignal, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import type {LocatedHighlightId} from '../../state/whats-new';
import {getWhatsNew, RELEASES} from '../../state/whats-new';
import {illustrations} from './illustrations';
import * as styles from './whats-new.css';

export function NewDot(props: {highlight: LocatedHighlightId}) {
  const news = getWhatsNew();
  let anchor: HTMLSpanElement | undefined;
  const [open, setOpen] = createSignal(false);
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
              onOpenChange={value => {
                setOpen(value);
                if (value) {
                  news.opened(props.highlight, 'coachmark');
                  news.seen(props.highlight, 'coachmark');
                }
              }}
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
                <Popover.Content class={styles.coachmark}>
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
                      onClick={() => setOpen(false)}
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
