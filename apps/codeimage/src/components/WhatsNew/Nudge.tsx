import {createId} from '@core/helpers/create-id';
import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import {Button, IconButton} from '@codeui/kit';
import {icons} from '@ui/kit-icons';
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
  untrack,
  createTrackedEffect,
} from 'solid-js';
import {Dynamic} from '@solidjs/web';
import {
  getWhatsNew,
  type RELEASES,
  type WhatsNew,
} from '@codeimage/store/whats-new';
import {releaseTitle} from './releaseDate';
import {SparkleIcon} from './SparkleIcon';
import {tabbableBeside} from './focus';
import {illustrations} from './illustrations';
import {duration, fromKeyboard} from './motion';
import * as styles from './whats-new.css';

/** The step on screen, and the one still fading out after Next. */
interface View {
  readonly step: number;
  readonly leaving?: number;
}

function focusWhenConnected(element: HTMLButtonElement) {
  queueMicrotask(() => {
    if (element.isConnected) element.focus({preventScroll: true});
  });
}

export function Nudge(props: {
  release: (typeof RELEASES)[number];
  dismiss: (keyboard: boolean) => void;
  keyboardMinimize?: boolean;
  entry: NonNullable<ReturnType<WhatsNew['current']>>['entry'];
}) {
  const news = getWhatsNew();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  const initialEntry = untrack(() => props.entry);
  const fromHeader = initialEntry === 'pointer' || initialEntry === 'keyboard';
  const initiallyMinimized = untrack(() => props.keyboardMinimize);
  const [expanded, setExpanded] = createSignal(fromHeader);
  const [view, setView] = createSignal<View>({step: 0});
  const [closing, setClosing] = createSignal(false);
  const [instant, setInstant] = createSignal(
    initialEntry === 'keyboard' || initiallyMinimized,
  );
  const step = createMemo(() => view().step);
  const highlight = () => props.release.highlights[step()];
  const located = (item: (typeof RELEASES)[number]['highlights'][number]) =>
    item.where !== null && news.canShowMe(item.id) ? item : null;
  const count = (): number => props.release.highlights.length;
  const last = () => step() === count() - 1;
  // Only the newest step change fades. Stepping faster drops the older one.
  const slides = () => {
    const {step, leaving} = view();
    return leaving === undefined ? [step] : [leaving, step];
  };
  const copyId = createId();
  let card: HTMLElement | undefined;
  let bar: HTMLDivElement | undefined;
  let barHeight = 0;
  let timer: number | undefined;
  // Focus inside the card would fall to the page when it leaves.
  const restoreFocus = () => {
    if (card?.contains(document.activeElement))
      tabbableBeside(card, 'before')?.focus({preventScroll: true});
  };
  onCleanup(() => {
    clearTimeout(timer);
    restoreFocus();
  });
  createTrackedEffect(() => {
    if (expanded()) news.opened(highlight().id, 'nudge');
  });

  const close = (keyboard: boolean) => {
    if (closing()) return;
    clearTimeout(timer);
    restoreFocus();
    if (keyboard) {
      props.dismiss(true);
      // Dismissal mounts the way back. Mobile has no header entry.
      queueMicrotask(() => {
        const trigger = document.querySelector<HTMLElement>(
          '[data-whats-new-trigger]',
        );
        if (trigger?.checkVisibility()) trigger.focus({preventScroll: true});
      });
      return;
    }
    setClosing(true);
    const dismiss = props.dismiss;
    timer = window.setTimeout(() => dismiss(false), duration.nudgeOut);
  };
  const next = (event: MouseEvent) => {
    if (last()) return close(fromKeyboard(event));
    clearTimeout(timer);
    const keyboard = fromKeyboard(event);
    setInstant(keyboard);
    setView(({step}) => ({
      step: step + 1,
      leaving: keyboard ? undefined : step,
    }));
    if (!keyboard)
      timer = window.setTimeout(
        () => setView(({step}) => ({step})),
        duration.step,
      );
  };

  return (
    <aside
      id="whats-new-nudge"
      ref={card}
      tabindex={-1}
      onKeyDown={event => {
        if (event.key !== 'Escape' || !expanded()) return;
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }}
      class={styles.nudge}
      aria-label={t('editor.whatsNew')}
      data-whats-new="nudge"
      data-closing={closing() ? '' : undefined}
      data-instant={instant() ? '' : undefined}
      inert={closing() || undefined}
    >
      <Show
        when={expanded()}
        fallback={
          <div ref={bar} class={styles.collapsed}>
            <SparkleIcon />
            <div class={styles.summary}>
              <strong>
                {t(count() === 1 ? 'whatsNew.newOne' : 'whatsNew.newMany', {
                  count: String(count()),
                })}
              </strong>
              <span class={styles.muted}>
                {releaseTitle(props.release, locale())}
              </span>
            </div>
            <Button
              ref={(element: HTMLButtonElement) => {
                if (initiallyMinimized) focusWhenConnected(element);
              }}
              size="sm"
              variant="primary"
              onClick={(event: MouseEvent) => {
                barHeight = bar?.offsetHeight ?? 0;
                setInstant(fromKeyboard(event));
                setExpanded(true);
              }}
            >
              {t('whatsNew.see')}
            </Button>
            <IconButton
              size="sm"
              variant="secondary"
              ghost
              aria-label={t('whatsNew.dismiss')}
              onClick={(event: MouseEvent) => close(fromKeyboard(event))}
            >
              <icons.CloseIcon />
            </IconButton>
          </div>
        }
      >
        <div class={styles.expanded} style={{'--nudge-from': `${barHeight}px`}}>
          <div class={`${styles.stage} ${styles.revealed}`}>
            <For each={slides()}>
              {index => {
                const item = () => props.release.highlights[index];
                const current = () => index === step();
                return (
                  <div
                    class={styles.slide}
                    data-leaving={current() ? undefined : ''}
                    aria-hidden={current() ? undefined : 'true'}
                    inert={!current() || undefined}
                  >
                    <Dynamic component={illustrations[item().id]} mode="play" />
                    <div
                      class={styles.copy}
                      id={current() ? copyId : undefined}
                    >
                      <span class={styles.tag}>
                        {t(
                          'experimental' in item()
                            ? 'editor.experimental'
                            : 'common.new',
                        )}
                      </span>
                      <h3 class={styles.title}>
                        {t(`whatsNew.highlights.${item().id}.title`)}
                      </h3>
                      <p class={styles.body}>
                        {t(`whatsNew.highlights.${item().id}.body`)}
                      </p>
                      <Show when={located(item())}>
                        {target => (
                          <Button
                            class={styles.reveal}
                            size="xs"
                            variant="secondary"
                            onClick={() => news.showMe(target().id, 'nudge')}
                          >
                            {t('whatsNew.showMe')}
                          </Button>
                        )}
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
          <div class={`${styles.actions} ${styles.revealed}`}>
            <div
              class={styles.steps}
              role="img"
              aria-label={t('whatsNew.step', {
                step: String(step() + 1),
                count: String(count()),
              })}
            >
              <For each={props.release.highlights}>
                {(_, index) => (
                  <span
                    class={styles.step}
                    data-current={step() === index() ? '' : undefined}
                  />
                )}
              </For>
            </div>
            <Button
              ref={focusWhenConnected}
              size="sm"
              variant="primary"
              aria-describedby={copyId}
              onClick={next}
            >
              {t(last() ? 'whatsNew.done' : 'whatsNew.next')}
            </Button>
          </div>
          {/* Last in tab order, but drawn in the corner, away from Next. */}
          <IconButton
            class={`${styles.nudgeClose} ${styles.revealed}`}
            size="xs"
            variant="secondary"
            ghost
            aria-label={t('whatsNew.dismiss')}
            onClick={(event: MouseEvent) => close(fromKeyboard(event))}
          >
            <icons.CloseIcon />
          </IconButton>
        </div>
      </Show>
    </aside>
  );
}
