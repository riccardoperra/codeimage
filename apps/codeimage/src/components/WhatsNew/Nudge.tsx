import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import {Button, IconButton, icons} from '@codeui/kit';
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {getWhatsNew, type RELEASES, type WhatsNew} from '../../state/whats-new';
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

export function Nudge(props: {
  release: (typeof RELEASES)[number];
  dismiss: () => void;
  entry: NonNullable<ReturnType<WhatsNew['current']>>['entry'];
}) {
  const news = getWhatsNew();
  const [t] = useI18n<AppLocaleEntries>();
  const initialEntry = untrack(() => props.entry);
  const fromHeader = () =>
    props.entry === 'pointer' || props.entry === 'keyboard';
  const [expanded, setExpanded] = createSignal(
    initialEntry === 'pointer' || initialEntry === 'keyboard',
  );
  const [view, setView] = createSignal<View>({step: 0});
  const [closing, setClosing] = createSignal(false);
  const [instant, setInstant] = createSignal(initialEntry === 'keyboard');
  const step = createMemo(() => view().step);
  const highlight = () => props.release.highlights[step()];
  const located = () => {
    const item = highlight();
    return item.where !== null && news.canShowMe(item.id) ? item : null;
  };
  const count = (): number => props.release.highlights.length;
  const last = () => step() === count() - 1;
  // Only the newest step change fades. Stepping faster drops the older one.
  const slides = () => {
    const {step, leaving} = view();
    return leaving === undefined ? [step] : [leaving, step];
  };
  const copyId = createUniqueId();
  let card: HTMLElement | undefined;
  let primary: HTMLButtonElement | undefined;
  let bar: HTMLDivElement | undefined;
  let barHeight = 0;
  let timer: number | undefined;
  // Focus inside the card would fall to the page when it leaves.
  const restoreFocus = () => {
    if (card?.contains(document.activeElement))
      (fromHeader()
        ? document.querySelector<HTMLElement>('[data-whats-new-trigger]')
        : tabbableBeside(card, 'before')
      )?.focus({preventScroll: true});
  };
  onMount(() => {
    if (fromHeader()) primary?.focus({preventScroll: true});
  });
  onCleanup(() => {
    clearTimeout(timer);
    restoreFocus();
  });
  createEffect(() => {
    if (expanded()) news.opened(highlight().id, 'nudge');
  });

  const close = (keyboard: boolean) => {
    if (closing()) return;
    clearTimeout(timer);
    restoreFocus();
    if (keyboard) return props.dismiss();
    setClosing(true);
    timer = window.setTimeout(props.dismiss, duration.nudgeOut);
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
      tabIndex={-1}
      on:keydown={event => {
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
                {t(`whatsNew.releases.${props.release.id}.title`)}
              </span>
            </div>
            <Button
              size="sm"
              theme="primary"
              onClick={event => {
                barHeight = bar?.offsetHeight ?? 0;
                setInstant(fromKeyboard(event));
                setExpanded(true);
                // The button that had focus is gone, so keep the keyboard here.
                primary?.focus();
              }}
            >
              {t('whatsNew.see')}
            </Button>
            <IconButton
              size="sm"
              theme="secondary"
              variant="ghost"
              aria-label={t('whatsNew.dismiss')}
              onClick={event => close(fromKeyboard(event))}
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
            <Show when={located()}>
              {item => (
                <Button
                  size="sm"
                  theme="secondary"
                  onClick={() => news.showMe(item().id, 'nudge')}
                >
                  {t('whatsNew.showMe')}
                </Button>
              )}
            </Show>
            <Button
              ref={element => {
                primary = element;
              }}
              size="sm"
              theme="primary"
              aria-describedby={copyId}
              onClick={next}
            >
              {t(last() ? 'whatsNew.done' : 'whatsNew.next')}
            </Button>
            <IconButton
              size="sm"
              theme="secondary"
              variant="ghost"
              aria-label={t('whatsNew.dismiss')}
              onClick={event => close(fromKeyboard(event))}
            >
              <icons.CloseIcon />
            </IconButton>
          </div>
        </div>
      </Show>
    </aside>
  );
}
