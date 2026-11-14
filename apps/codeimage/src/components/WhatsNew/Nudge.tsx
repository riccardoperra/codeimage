import {Button, IconButton, icons} from '@codeui/kit';
import {
  createEffect,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  Show,
} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {getWhatsNew, type RELEASES} from '../../state/whats-new';
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
}) {
  const news = getWhatsNew();
  const [expanded, setExpanded] = createSignal(false);
  const [view, setView] = createSignal<View>({step: 0});
  const [closing, setClosing] = createSignal(false);
  const [instant, setInstant] = createSignal(false);
  const step = () => view().step;
  const highlight = () => props.release.highlights[step()];
  const located = () => {
    const item = highlight();
    return item.where !== null && news.canShowMe(item.id) ? item : null;
  };
  const last = () => step() === props.release.highlights.length - 1;
  // Only the newest step change fades. Stepping faster drops the older one.
  const slides = () => {
    const {step, leaving} = view();
    return leaving === undefined ? [step] : [leaving, step];
  };
  const copyId = createUniqueId();
  let primary: HTMLButtonElement | undefined;
  let bar: HTMLDivElement | undefined;
  let barHeight = 0;
  let timer: number | undefined;
  onCleanup(() => clearTimeout(timer));
  createEffect(() => {
    if (expanded()) news.opened(highlight().id, 'nudge');
  });

  const close = (event: MouseEvent) => {
    if (closing()) return;
    clearTimeout(timer);
    if (fromKeyboard(event)) return props.dismiss();
    setClosing(true);
    timer = window.setTimeout(props.dismiss, duration.nudgeOut);
  };
  const next = (event: MouseEvent) => {
    if (last()) return close(event);
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
      class={styles.nudge}
      aria-label="What's new"
      data-whats-new="nudge"
      data-closing={closing() ? '' : undefined}
      data-instant={instant() ? '' : undefined}
      inert={closing() || undefined}
    >
      <Show
        when={expanded()}
        fallback={
          <div ref={bar} class={styles.collapsed}>
            <span aria-hidden="true">✦</span>
            <div class={styles.summary}>
              <strong>{props.release.highlights.length} new things</strong>
              <span class={styles.muted}>{props.release.title}</span>
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
              See
            </Button>
            <IconButton
              size="sm"
              theme="secondary"
              variant="ghost"
              aria-label="Dismiss what's new"
              onClick={close}
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
                        {'experimental' in item() ? 'Experiment' : 'New'}
                      </span>
                      <h3 class={styles.title}>{item().title}</h3>
                      <p class={styles.body}>{item().body}</p>
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
            <Show when={located()}>
              {item => (
                <Button
                  size="sm"
                  theme="secondary"
                  onClick={() => news.showMe(item().id, 'nudge')}
                >
                  Show me
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
              {last() ? 'Done' : 'Next'}
            </Button>
            <IconButton
              size="sm"
              theme="secondary"
              variant="ghost"
              aria-label="Dismiss what's new"
              onClick={close}
            >
              <icons.CloseIcon />
            </IconButton>
          </div>
        </div>
      </Show>
    </aside>
  );
}
