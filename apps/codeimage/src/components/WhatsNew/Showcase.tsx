import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import {Button, Dialog, IconButton, icons, Tooltip} from '@codeui/kit';
import {Dialog as KDialog} from '@kobalte/core/dialog';
import {createEffect, For, onCleanup, onMount, Show, untrack} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {getWhatsNew, type RELEASES} from '../../state/whats-new';
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
import * as styles from './whats-new.css';

const at = (start: number) => ({'--whats-new-at': ms(start)});
const cardAt = (index: number, count: number) => {
  const {cards, stagger, play} = showcaseAt;
  const start = cards + index * stagger;
  return {
    ...at(start),
    '--whats-new-play-at': ms(play),
    // A full row, pairs, then three thirds tile both six and eight cards.
    '--whats-new-span': index === 0 ? 6 : index < count - 3 ? 3 : 2,
  };
};

export function Showcase(props: {
  release: (typeof RELEASES)[number];
  dismiss: () => void;
  minimize: (keyboard: boolean) => void;
}) {
  const news = getWhatsNew();
  const headlines = () =>
    props.release.highlights.filter(highlight => !('accessory' in highlight));
  let title!: HTMLDivElement;
  let exit: Animation | undefined;
  let minimizing = false;
  let disposed = false;
  onMount(() => {
    const panel = title.closest('[role="dialog"]');
    // During the exit, Escape must reach dismissal before a tooltip consumes it.
    const interrupt = (event: Event) => {
      if (
        !minimizing ||
        !(event instanceof KeyboardEvent) ||
        event.key !== 'Escape'
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      props.dismiss();
    };
    panel?.addEventListener('keydown', interrupt, true);
    onCleanup(() => panel?.removeEventListener('keydown', interrupt, true));
  });
  const minimize = (event: MouseEvent) => {
    if (minimizing) return;
    const keyboard = fromKeyboard(event);
    if (keyboard) return props.minimize(true);
    const panel = title.closest<HTMLElement>('[role="dialog"]');
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
      // An announcement has no opener for the modal to restore focus to.
      // A reveal may already have focused its target in the meantime.
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
  createEffect(() =>
    props.release.highlights.forEach(highlight =>
      news.opened(highlight.id, 'showcase'),
    ),
  );
  return (
    <Dialog
      size="xl"
      open
      onOpenChange={open => {
        if (!open) props.dismiss();
      }}
    >
      <div ref={title} class={styles.sheetTitle}>
        <KDialog.Title>{t('editor.whatsNew')}</KDialog.Title>
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
          <KDialog.CloseButton
            as={IconButton}
            aria-label={t('common.close')}
            size="xs"
            theme="secondary"
          >
            <icons.CloseIcon />
          </KDialog.CloseButton>
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
                            onClick={() => {
                              props.dismiss();
                              requestAnimationFrame(() =>
                                news.showMe(located().id, 'showcase'),
                              );
                            }}
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
        <section class={styles.accessories} aria-labelledby="whats-new-also">
          <h3 id="whats-new-also" class={styles.alsoTitle}>
            {t('whatsNew.alsoNew')}
          </h3>
          <For
            each={props.release.highlights.filter(
              highlight => 'accessory' in highlight,
            )}
          >
            {highlight => (
              <article class={styles.accessory} data-highlight={highlight.id}>
                <div class={styles.accessoryThumb}>
                  <Dynamic
                    component={illustrations[highlight.id]}
                    mode="thumb"
                  />
                </div>
                <div class={styles.accessoryCopy}>
                  <h4 class={styles.accessoryTitle}>
                    {t(`whatsNew.highlights.${highlight.id}.title`)}
                  </h4>
                  <p class={styles.accessoryBody}>
                    {t(`whatsNew.highlights.${highlight.id}.body`)}
                  </p>
                </div>
                <Show
                  when={
                    highlight.where !== null && news.canShowMe(highlight.id)
                  }
                >
                  <Button
                    size="sm"
                    theme="secondary"
                    onClick={() => {
                      props.dismiss();
                      requestAnimationFrame(() =>
                        news.showMe(highlight.id, 'showcase'),
                      );
                    }}
                  >
                    {t('whatsNew.showMe')}
                  </Button>
                </Show>
              </article>
            )}
          </For>
        </section>
        <footer
          class={`${styles.sheetFooter} ${styles.fade}`}
          style={at(showcaseAt.footer)}
        >
          <Button theme="primary" onClick={props.dismiss}>
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
