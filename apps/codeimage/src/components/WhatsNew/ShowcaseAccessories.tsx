import {useI18n} from '@codeimage/locale';
import {Button} from '@ui/legacy-controls';
import {Dynamic} from '@solidjs/web';
import {For, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {
  getWhatsNew,
  type LocatedHighlightId,
  type RELEASES,
} from '@codeimage/store/whats-new';
import {illustrations} from './illustrations';
import * as styles from './whats-new.css';

type Release = (typeof RELEASES)[number];

export function ShowcaseAccessories(props: {
  release: Release;
  reveal: (id: LocatedHighlightId, event: MouseEvent) => void;
}) {
  const news = getWhatsNew();
  const [t] = useI18n<AppLocaleEntries>();

  return (
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
              <Dynamic component={illustrations[highlight.id]} mode="thumb" />
            </div>
            <div class={styles.accessoryCopy}>
              <h4 class={styles.accessoryTitle}>
                {t(`whatsNew.highlights.${highlight.id}.title`)}
              </h4>
              <p class={styles.accessoryBody}>
                {t(`whatsNew.highlights.${highlight.id}.body`)}
              </p>
            </div>
            <Show when={highlight.where !== null && highlight}>
              {located => (
                <Show when={news.canShowMe(located().id)}>
                  <Button
                    class={styles.accessoryAction}
                    size="sm"
                    theme="secondary"
                    onClick={(event: MouseEvent) =>
                      props.reveal(located().id, event)
                    }
                  >
                    {t('whatsNew.showMe')}
                  </Button>
                </Show>
              )}
            </Show>
          </article>
        )}
      </For>
    </section>
  );
}
