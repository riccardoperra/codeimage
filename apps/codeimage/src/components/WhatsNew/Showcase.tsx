import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import {Button, IconButton, Tooltip} from '@ui/legacy-controls';
import {icons} from '@ui/kit-icons';
import {Dialog, DialogTitle} from '@ui/Dialog';
import {For, onCleanup, Show, untrack, createTrackedEffect} from 'solid-js';
import {Dynamic} from '@solidjs/web';
import {getWhatsNew, type RELEASES} from '@codeimage/store/whats-new';
import {illustrations} from './illustrations';
import {
  curve,
  duration,
  fromKeyboard,
  ms,
  reduceMotion,
  showcaseAt,
} from './motion';
import {releaseDate, releaseTitle} from './releaseDate';
import {ShowcaseAccessories} from './ShowcaseAccessories';
import * as styles from './whats-new.css';

const at = (start: number) => ({'--whats-new-at': ms(start)});
const cardAt = (index: number, count: number) => {
  const {cards, stagger, play} = showcaseAt;
  const start = cards + index * stagger;
  return {
    ...at(start),
    '--whats-new-play-at': ms(play),
    '--whats-new-span': index === 0 ? 6 : index < count - 3 ? 3 : 2,
  };
};

export function Showcase(props: {
  release: (typeof RELEASES)[number];
  dismiss: (keyboard: boolean) => void;
  minimize: (keyboard: boolean) => void;
}) {
  const news = getWhatsNew();
  const headlines = () =>
    props.release.highlights.filter(highlight => !('accessory' in highlight));
  let title!: HTMLDivElement;
  let exit: Animation | undefined;
  let minimizing = false;
  let closing = false;
  let disposed = false;
  const close = (keyboard: boolean, after?: () => void) => {
    if (closing) return;
    closing = true;
    exit?.cancel();
    const finish = () => {
      if (disposed) return;
      props.dismiss(keyboard);
      queueMicrotask(() => {
        if (after) return after();
        if (!keyboard) return;
        const trigger = document.querySelector<HTMLElement>(
          '[data-whats-new-trigger]',
        );
        if (trigger?.checkVisibility()) trigger.focus({preventScroll: true});
      });
    };
    const panel = title.closest<HTMLElement>(
      '[role="dialog"], [role="alertdialog"]',
    );
    if (keyboard || !panel) return finish();
    const reduced = matchMedia(reduceMotion).matches;
    exit = panel.animate(
      reduced
        ? [{opacity: 1}, {opacity: 0}]
        : [
            {opacity: 1, transform: getComputedStyle(panel).transform},
            {opacity: 0, transform: 'scale(.96)'},
          ],
      {duration: duration.nudgeOut, easing: curve.out, fill: 'forwards'},
    );
    void exit.finished.then(finish).catch(() => {});
  };
  const minimize = (event: MouseEvent) => {
    if (minimizing || closing) return;
    const keyboard = fromKeyboard(event);
    if (keyboard) return props.minimize(true);
    const panel = title.closest<HTMLElement>(
      '[role="dialog"], [role="alertdialog"]',
    );
    if (!panel) return props.minimize(false);
    minimizing = true;
    const box = panel.getBoundingClientRect();
    const phone = matchMedia('(max-width: 768px)').matches;
    const x = (phone ? 12 : 28) - box.left;
    const scale = Math.min(0.94, 340 / box.width);
    const y = window.innerHeight - (phone ? 76 : 28) - box.bottom;
    panel.style.transformOrigin = 'bottom left';
    const reduced = matchMedia(reduceMotion).matches;
    exit = panel.animate(
      reduced
        ? [{opacity: 1}, {opacity: 0}]
        : [
            {opacity: 1, transform: getComputedStyle(panel).transform},
            {
              opacity: 0,
              transform: `translate(${x}px, ${y}px) scale(${scale})`,
            },
          ],
      {duration: duration.minimize, easing: curve.out, fill: 'forwards'},
    );
    void exit.finished
      .then(() => {
        if (!disposed) untrack(() => props.minimize(false));
      })
      .catch(() => {});
  };
  onCleanup(() => {
    disposed = true;
    exit?.cancel();
  });
  onCleanup(() =>
    requestAnimationFrame(() => {
      if (document.activeElement === document.body)
        [...document.querySelectorAll<HTMLElement>('button:not([disabled])')]
          .find(
            element =>
              element.checkVisibility({visibilityProperty: true}) &&
              !element.closest(
                '[inert], [aria-hidden="true"], [data-news-dot]',
              ),
          )
          ?.focus({preventScroll: true});
    }),
  );
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  createTrackedEffect(() =>
    props.release.highlights.forEach(highlight =>
      news.opened(highlight.id, 'showcase'),
    ),
  );
  return (
    <Dialog
      size="xl"
      open
      onEscapeKeyDown={event => {
        event.preventDefault();
        event.stopPropagation();
        closing = false;
        close(true);
      }}
      onOpenChange={open => {
        if (!open) close(false);
      }}
    >
      <div ref={title} class={styles.sheetTitle}>
        <DialogTitle>{t('editor.whatsNew')}</DialogTitle>
        <div class={styles.headerActions}>
          <Tooltip content={t('whatsNew.minimize')}>
            <IconButton
              size="xs"
              theme="secondary"
              aria-label={t('whatsNew.minimize')}
              onClick={minimize}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8h10"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </IconButton>
          </Tooltip>
          <IconButton
            onClick={(event: MouseEvent) => close(fromKeyboard(event))}
            aria-label={t('common.close')}
            size="xs"
            theme="secondary"
          >
            <icons.CloseIcon />
          </IconButton>
        </div>
      </div>
      <div class={styles.sheet} data-whats-new="showcase">
        <header class={styles.hero}>
          <time
            class={`${styles.tag} ${styles.fade}`}
            style={at(showcaseAt.title)}
            datetime={props.release.date}
          >
            {releaseDate(props.release, locale())}
          </time>
          <h2
            class={`${styles.heroTitle} ${styles.lead}`}
            style={at(showcaseAt.title)}
          >
            {releaseTitle(props.release, locale())}
          </h2>
          <p
            class={`${styles.body} ${styles.support}`}
            style={at(showcaseAt.subtitle)}
          >
            {t('whatsNew.hero')}
          </p>
        </header>
        <div class={styles.grid}>
          <For each={headlines()}>
            {(highlight, index) => (
              <article
                class={styles.card}
                style={cardAt(index(), headlines().length)}
                data-highlight={highlight.id}
              >
                <Dynamic component={illustrations[highlight.id]} mode="play" />
                <div class={styles.copy}>
                  <span class={styles.tag}>
                    {t(
                      'experimental' in highlight
                        ? 'editor.experimental'
                        : 'common.new',
                    )}
                  </span>
                  <h3 class={styles.title}>
                    {t(`whatsNew.highlights.${highlight.id}.title`)}
                  </h3>
                  <p class={styles.body}>
                    {t(`whatsNew.highlights.${highlight.id}.body`)}
                  </p>
                  <Show when={highlight.where !== null && highlight}>
                    {located => (
                      <Show when={news.canShowMe(located().id)}>
                        <div class={styles.actions}>
                          <Button
                            size="sm"
                            theme="secondary"
                            onClick={(event: MouseEvent) =>
                              close(fromKeyboard(event), () =>
                                news.showMe(located().id, 'showcase'),
                              )
                            }
                          >
                            {t('whatsNew.showMe')}
                          </Button>
                        </div>
                      </Show>
                    )}
                  </Show>
                </div>
              </article>
            )}
          </For>
        </div>
        <ShowcaseAccessories
          release={props.release}
          reveal={(id, event) =>
            close(fromKeyboard(event), () => news.showMe(id, 'showcase'))
          }
        />
        <footer
          class={`${styles.sheetFooter} ${styles.fade}`}
          style={at(showcaseAt.footer)}
        >
          <Button
            theme="primary"
            onClick={(event: MouseEvent) => close(fromKeyboard(event))}
          >
            {t('whatsNew.start')}
          </Button>
          <a
            class={styles.link}
            href="https://github.com/riccardoperra/codeimage/releases"
            target="_blank"
            rel="noreferrer"
          >
            {t('whatsNew.older')} ↗
          </a>
        </footer>
      </div>
    </Dialog>
  );
}
