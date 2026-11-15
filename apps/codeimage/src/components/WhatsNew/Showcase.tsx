import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import {Button, Dialog, IconButton, icons} from '@codeui/kit';
import {Dialog as KDialog} from '@kobalte/core/dialog';
import {createEffect, For, onCleanup, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {getWhatsNew, type RELEASES} from '../../state/whats-new';
import {illustrations} from './illustrations';
import {ms, showcaseAt} from './motion';
import {releaseDate, releaseTitle} from './releaseDate';
import * as styles from './whats-new.css';

const at = (start: number) => ({'--whats-new-at': ms(start)});
const cardAt = (index: number) => {
  const {cards, play} = showcaseAt;
  const start = cards[Math.min(index, cards.length - 1)];
  return {...at(start), '--whats-new-play-at': ms(start + play)};
};

export function Showcase(props: {
  release: (typeof RELEASES)[number];
  dismiss: () => void;
}) {
  const news = getWhatsNew();
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
      <div class={styles.sheetTitle}>
        <KDialog.Title>{t('editor.whatsNew')}</KDialog.Title>
        <KDialog.CloseButton
          as={IconButton}
          aria-label={t('common.close')}
          size="xs"
          theme="secondary"
        >
          <icons.CloseIcon />
        </KDialog.CloseButton>
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
          <For each={props.release.highlights}>
            {(highlight, index) => (
              <article class={styles.card} style={cardAt(index())}>
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
