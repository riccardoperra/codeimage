import {Button, IconButton} from '@codeui/kit';
import {createEffect, createSignal, For, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {getWhatsNew, type RELEASES} from '../../state/whats-new';
import {illustrations} from './illustrations';
import * as styles from './whats-new.css';

export function Nudge(props: {
  release: (typeof RELEASES)[number];
  dismiss: () => void;
  located: boolean;
}) {
  const news = getWhatsNew();
  const [expanded, setExpanded] = createSignal(false);
  const [step, setStep] = createSignal(0);
  const highlight = () => props.release.highlights[step()];
  createEffect(() => {
    if (expanded()) news.opened(highlight().id, 'nudge');
  });
  return (
    <aside class={styles.nudge} aria-label="What's new" data-whats-new="nudge">
      <Show
        when={expanded()}
        fallback={
          <div class={styles.collapsed}>
            <span aria-hidden="true">✦</span>
            <div class={styles.summary}>
              <strong>{props.release.highlights.length} new things</strong>
              <span class={styles.muted}>{props.release.title}</span>
            </div>
            <Button size="sm" theme="primary" onClick={() => setExpanded(true)}>
              See
            </Button>
            <IconButton
              size="sm"
              theme="secondary"
              variant="ghost"
              aria-label="Dismiss what's new"
              onClick={props.dismiss}
            >
              ×
            </IconButton>
          </div>
        }
      >
        <div class={styles.expanded}>
          <Dynamic component={illustrations[highlight().id]} />
          <div class={styles.copy}>
            <span class={styles.tag}>
              {'experimental' in highlight() ? 'Experiment' : 'New'}
            </span>
            <h3 class={styles.title}>{highlight().title}</h3>
            <p class={styles.body}>{highlight().body}</p>
          </div>
          <div class={styles.actions}>
            <div
              class={styles.steps}
              aria-label={`Step ${step() + 1} of ${props.release.highlights.length}`}
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
            <Show when={props.located && highlight().where}>
              <Button
                size="sm"
                theme="secondary"
                onClick={() => news.showMe(highlight().id, 'nudge')}
              >
                Show me
              </Button>
            </Show>
            <Button
              size="sm"
              theme="primary"
              onClick={() =>
                step() === props.release.highlights.length - 1
                  ? props.dismiss()
                  : setStep(value => value + 1)
              }
            >
              {step() === props.release.highlights.length - 1 ? 'Done' : 'Next'}
            </Button>
            <IconButton
              size="sm"
              theme="secondary"
              variant="ghost"
              aria-label="Dismiss what's new"
              onClick={props.dismiss}
            >
              ×
            </IconButton>
          </div>
        </div>
      </Show>
    </aside>
  );
}
