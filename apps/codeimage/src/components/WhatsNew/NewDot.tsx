import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import {Button} from '@codeui/kit';
import {Popover} from '@ui/Popover';
import type {JSX} from '@solidjs/web';
import {
  createSignal,
  flush,
  onCleanup,
  Show,
  createTrackedEffect,
} from 'solid-js';
import {Dynamic} from '@solidjs/web';
import type {LocatedHighlightId, Where} from '@codeimage/store/whats-new';
import {getWhatsNew, RELEASES} from '@codeimage/store/whats-new';
import {tabbableBeside} from './focus';
import {illustrations} from './illustrations';
import {duration, fromKeyboard} from './motion';
import * as styles from './whats-new.css';

type NewDotProps =
  | {at: Where; children?: undefined; filled?: undefined}
  | {at: Where; children: JSX.Element; filled?: boolean};

type FocusSide = 'before' | 'after';

function handleCoachmarkKey(
  event: KeyboardEvent,
  close: (side?: FocusSide) => void,
) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    close();
  } else if (event.key === 'Tab') {
    event.preventDefault();
    close(event.shiftKey ? 'before' : 'after');
  }
}

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
  const [t] = useI18n<AppLocaleEntries>();
  const news = getWhatsNew();
  // The opened highlight stays on this dot until its coachmark has shrunk
  // back into it, even once seen and another highlight holds the place.
  const [pinned, setPinned] = createSignal<LocatedHighlightId>();
  const current = () =>
    pinned() ?? news.revealedAt(props.at) ?? news.dotAt(props.at);
  let anchor: HTMLSpanElement | undefined;
  let content: HTMLDivElement | undefined;
  // A seen dot leaves with its coachmark, so focus cannot return to it.
  // The popover unmounts with the dot, before its own close focus can run.
  let returnTo: HTMLElement | undefined;
  const [open, setOpen] = createSignal(false);
  // A coachmark opened or closed from the keyboard appears and goes at once.
  const [instant, setInstant] = createSignal(false);
  const animateInstantly = (value: boolean) => {
    flush(() => setInstant(value));
  };
  let closed: number | undefined;
  onCleanup(() => clearTimeout(closed));
  const toggle = (value: boolean, side?: FocusSide, automatic = false) => {
    if (value === open()) return;
    if (value) {
      // Pin before marking seen, or the dot unmounts for a moment and comes
      // back as a new element, without its fade.
      const id = current();
      if (!id) return;
      clearTimeout(closed);
      setPinned(id);
      setOpen(true);
      news.opened(id, 'coachmark');
      if (!automatic) news.seen(id);
      return;
    }
    if (anchor && (side !== undefined || !news.dotAt(props.at)))
      returnTo = tabbableBeside(anchor, side ?? 'before', content);
    clearTimeout(closed);
    setOpen(false);
    const id = pinned();
    if (id) news.endReveal(id);
    if (instant()) setPinned(undefined);
    else
      closed = window.setTimeout(
        () => setPinned(undefined),
        duration.coachmarkOut,
      );
    returnTo?.focus();
  };
  const closeFromKeyboard = (side?: FocusSide) => {
    animateInstantly(true);
    toggle(false, side);
  };
  createTrackedEffect(() => {
    // Export reveals its menu. Its arrow stays outside that menu's focus scope.
    if (
      props.at === 'export' ||
      props.at.startsWith('export:') ||
      !news.revealedAt(props.at)
    )
      return;
    requestAnimationFrame(() => {
      if (!anchor?.isConnected || !news.revealedAt(props.at)) return;
      anchor.scrollIntoView({block: 'nearest', inline: 'nearest'});
      animateInstantly(true);
      toggle(true, undefined, true);
    });
  });
  const highlight = () =>
    RELEASES.flatMap(release => release.highlights).find(
      item => item.id === current(),
    );
  return (
    <Show when={highlight()}>
      {item => (
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
            exitDuration={instant() ? 0 : duration.coachmarkOut}
          >
            <Popover.Trigger
              class={styles.dot}
              onClick={(event: MouseEvent) =>
                animateInstantly(fromKeyboard(event))
              }
              data-instant={instant() ? '' : undefined}
              aria-label={t('whatsNew.newLabel', {
                title: t(`whatsNew.highlights.${item().id}.title`),
              })}
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
                onEscapeKeyDown={() => animateInstantly(true)}
                onPointerDownOutside={() => animateInstantly(false)}
                onKeyDown={(event: KeyboardEvent) =>
                  handleCoachmarkKey(event, closeFromKeyboard)
                }
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
                    {t(`whatsNew.highlights.${item().id}.title`)}
                  </Popover.Title>
                  <Popover.Description class={styles.body}>
                    {t(`whatsNew.highlights.${item().id}.body`)}
                  </Popover.Description>
                </div>
                <div class={styles.actions}>
                  <span class={styles.steps} />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(event: MouseEvent) => {
                      news.seen(item().id);
                      animateInstantly(fromKeyboard(event));
                      toggle(false);
                    }}
                  >
                    {t('whatsNew.gotIt')}
                  </Button>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover>
        </span>
      )}
    </Show>
  );
}
