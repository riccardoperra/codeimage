import {Button, Dialog} from '@codeui/kit';
import {createEffect, For, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {getWhatsNew, type RELEASES} from '../../state/whats-new';
import {illustrations} from './illustrations';
import {ms, showcaseAt} from './motion';
import {releaseDate} from './releaseDate';
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
  createEffect(() =>
    props.release.highlights.forEach(highlight =>
      news.opened(highlight.id, 'showcase'),
    ),
  );
  return (
    <Dialog
      title="What's new"
      size="xl"
      open
      onOpenChange={open => {
        if (!open) props.dismiss();
      }}
    >
      <div class={styles.sheet} data-whats-new="showcase">
        <header class={styles.hero}>
          <time
            class={`${styles.tag} ${styles.fade}`}
            style={at(showcaseAt.title)}
            datetime={props.release.date}
          >
            {releaseDate(props.release)}
          </time>
          <h2
            class={`${styles.heroTitle} ${styles.lead}`}
            style={at(showcaseAt.title)}
          >
            {props.release.title}
          </h2>
          <p
            class={`${styles.body} ${styles.support}`}
            style={at(showcaseAt.subtitle)}
          >
            New tools and choices for your editor.
          </p>
        </header>
        <div class={styles.grid}>
          <For each={props.release.highlights}>
            {(highlight, index) => (
              <article class={styles.card} style={cardAt(index())}>
                <Dynamic component={illustrations[highlight.id]} mode="play" />
                <div class={styles.copy}>
                  <span class={styles.tag}>
                    {'experimental' in highlight ? 'Experiment' : 'New'}
                  </span>
                  <h3 class={styles.title}>{highlight.title}</h3>
                  <p class={styles.body}>{highlight.body}</p>
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
                            Show me
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
            Start creating
          </Button>
          <a
            class={styles.link}
            href="https://github.com/riccardoperra/codeimage/releases"
            target="_blank"
            rel="noreferrer"
          >
            Older releases on GitHub ↗
          </a>
        </footer>
      </div>
    </Dialog>
  );
}
