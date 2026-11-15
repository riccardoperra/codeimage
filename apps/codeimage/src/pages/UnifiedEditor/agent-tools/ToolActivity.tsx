import {useI18n} from '@codeimage/locale';
import {IconButton, icons} from '@codeui/kit';
import type {Accessor} from 'solid-js';
import {
  createEffect,
  createSignal,
  For,
  Match,
  on,
  onCleanup,
  Show,
  Switch,
} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {agentActivity} from '../../../i18n/agentActivity';
import type {SummaryWords, ToolCall, ToolSource} from './activity';
import {activity} from './activity';
import * as styles from './tool-activity.css';

const HIDE_AFTER_MS = 5000;
const EXIT_MS = 200;

const SOURCE_KEY = {
  webmcp: 'webmcp',
  devtools: 'devtools',
  'local-ai': 'localAi',
} as const satisfies Record<ToolSource, string>;

type TitledTool = keyof typeof agentActivity.en.agentActivity.tool;
const titled = (tool: string): tool is TitledTool =>
  Object.hasOwn(agentActivity.en.agentActivity.tool, tool);

/** The words `summarize` needs, in the page's language. */
export function useSummaryWords(): SummaryWords {
  const [t] = useI18n<AppLocaleEntries>();
  return {
    lines: count =>
      count === 1
        ? t('agentActivity.line')
        : t('agentActivity.lines', {count: String(count)}),
    toggle: value => t(value ? 'agentActivity.on' : 'agentActivity.off'),
    delivery: delivery =>
      delivery === 'download'
        ? t('agentActivity.delivery.download')
        : delivery === 'clipboard'
          ? t('agentActivity.delivery.clipboard')
          : delivery === 'new_tab'
            ? t('agentActivity.delivery.newTab')
            : delivery,
  };
}

/**
 * The room the What's new Nudge takes at the bottom of the window, so the card
 * can sit above it. Measured only while the card shows.
 */
function nudgeClearance(active: Accessor<boolean>): Accessor<number> {
  const [room, setRoom] = createSignal(0);
  createEffect(() => {
    if (!active()) return;
    let frame = 0;
    let watched: HTMLElement | undefined;
    const resize = new ResizeObserver(() => schedule());
    const measure = () => {
      frame = 0;
      const nudge =
        document.querySelector<HTMLElement>(
          '[data-whats-new="nudge"]:not([data-closing])',
        ) ?? undefined;
      if (nudge !== watched) {
        if (watched) resize.unobserve(watched);
        if (nudge) resize.observe(nudge);
        watched = nudge;
      }
      // Its offset box, not its rect: the Nudge slides in with a transform.
      setRoom(
        nudge
          ? nudge.offsetHeight + parseFloat(getComputedStyle(nudge).bottom)
          : 0,
      );
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(measure);
    };
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-closing'],
    });
    measure();
    onCleanup(() => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
    });
  });
  return room;
}

/**
 * What an agent is doing to the editor, call by call. It shows on the first
 * call and hides a while after the last one settles, unless the pointer or
 * the focus is on it.
 */
export function ToolActivity() {
  const [t] = useI18n<AppLocaleEntries>();
  const [hovered, setHovered] = createSignal(false);
  const [focused, setFocused] = createSignal(false);
  const [closing, setClosing] = createSignal(false);
  const shown = () => activity.calls().length > 0;
  const latest = () => activity.calls().at(-1);
  const room = nudgeClearance(shown);
  let exit: ReturnType<typeof setTimeout> | undefined;

  const dismiss = () => {
    clearTimeout(exit);
    setClosing(true);
    exit = setTimeout(() => {
      activity.clear();
      setClosing(false);
      setHovered(false);
      setFocused(false);
    }, EXIT_MS);
  };

  createEffect(() => {
    if (!shown() || activity.running() || hovered() || focused()) return;
    const timer = setTimeout(dismiss, HIDE_AFTER_MS);
    onCleanup(() => clearTimeout(timer));
  });

  // A call that starts while the card leaves keeps it on screen.
  createEffect(
    on(
      () => latest()?.id,
      () => {
        clearTimeout(exit);
        setClosing(false);
      },
      {defer: true},
    ),
  );
  onCleanup(() => clearTimeout(exit));

  const call = (id: number) => activity.calls().find(call => call.id === id);
  const title = (tool: string) =>
    titled(tool) ? t(`agentActivity.tool.${tool}`) : tool;
  const failure = (call: ToolCall) =>
    call.status === 'failed' ? call.error : undefined;

  return (
    <Show when={shown()}>
      <section
        class={styles.card}
        aria-label={t('agentActivity.label')}
        data-tool-activity
        data-closing={closing() ? '' : undefined}
        style={{'--above-nudge': `${room()}px`}}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocusIn={() => setFocused(true)}
        onFocusOut={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setFocused(false);
        }}
      >
        <div class={styles.header}>
          <h2 class={styles.heading}>{t('agentActivity.agent')}</h2>
          <Show when={latest()}>
            {last => (
              <span class={styles.chip} data-source={last().source}>
                {t(`agentActivity.source.${SOURCE_KEY[last().source]}`)}
              </span>
            )}
          </Show>
          <IconButton
            class={styles.close}
            size="xs"
            theme="secondary"
            variant="ghost"
            aria-label={t('agentActivity.dismiss')}
            onClick={dismiss}
          >
            <icons.CloseIcon />
          </IconButton>
        </div>
        <div role="status" aria-live="polite">
          {/* Keyed by id, so a call that settles updates its row in place. */}
          <ol class={styles.list}>
            <For each={activity.calls().map(call => call.id)}>
              {id => (
                <Show when={call(id)}>
                  {entry => (
                    <li
                      class={styles.row}
                      data-status={entry().status}
                      data-tool={entry().tool}
                      data-read-only={entry().readOnly ? '' : undefined}
                    >
                      <span
                        class={styles.status}
                        data-status={entry().status}
                        role="img"
                        aria-label={t(`agentActivity.status.${entry().status}`)}
                      >
                        <Switch>
                          <Match when={entry().status === 'running'}>
                            <span class={styles.spinner} />
                          </Match>
                          <Match when={entry().status === 'done'}>
                            <icons.CheckIcon class={styles.icon} />
                          </Match>
                          <Match when={entry().status === 'failed'}>
                            <icons.CloseIcon class={styles.icon} />
                          </Match>
                        </Switch>
                      </span>
                      <span class={styles.body}>
                        <span class={styles.titleLine}>
                          <span class={styles.title}>
                            {title(entry().tool)}
                          </span>
                          <code class={styles.name} data-tool-name>
                            {entry().tool}
                          </code>
                        </span>
                        <Show when={entry().summary}>
                          <span class={styles.summary} data-summary>
                            {entry().summary}
                          </span>
                        </Show>
                        <Show when={failure(entry())}>
                          {error => (
                            <span
                              class={styles.error}
                              data-error
                              title={error()}
                            >
                              {error()}
                            </span>
                          )}
                        </Show>
                      </span>
                    </li>
                  )}
                </Show>
              )}
            </For>
          </ol>
        </div>
      </section>
    </Show>
  );
}
