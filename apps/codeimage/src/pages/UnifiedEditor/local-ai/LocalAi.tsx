import {useI18n} from '@codeimage/locale';
import {Button, IconButton, icons, TextArea} from '@codeui/kit';
import type {Accessor} from 'solid-js';
import {
  createEffect,
  createSignal,
  Index,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {summarize} from '../agent-tools/activity';
import type {AgentTool} from '../agent-tools/tools';
import {ToolRow, useSummaryWords} from '../agent-tools/ToolActivity';
import {spinner} from '../agent-tools/tool-activity.css';
import type {EditorPageState} from '../page-state';
import {ArrowUpIcon, PromptIcon} from '../shell/icons';
import {preferences} from '../shell/preferences';
import {settings} from '../shell/settings-state';
import type {Entry, Run} from './agent';
import {MAX_TURNS, runAgent} from './agent';
import {chromeProvider} from './chrome-provider';
import {languageModel, log} from './language-model';
import * as styles from './local-ai.css';

/** What the bar needs from the editor it sits in. */
interface Host {
  readonly compact: Accessor<boolean>;
  readonly editable: Accessor<boolean>;
  readonly send: (request: string) => void;
  readonly stop: () => void;
}

const [host, setHost] = createSignal<Host>();
const [open, setOpen] = createSignal(false);
const [draft, setDraft] = createSignal('');
const [asked, setAsked] = createSignal('');
const [run, setRun] = createSignal<Run>();

const busy = () => {
  const phase = run()?.phase.kind;
  return phase === 'thinking' || phase === 'calling';
};

const focusField = () =>
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>('[data-local-ai] textarea')?.focus(),
  );

/** The Ask AI bar, which an action bar turns into and the command menu opens. */
export const localAi = {
  /**
   * On with the experiment and the model, on an editable snippet, and not on
   * a phone.
   */
  enabled: () => {
    const editor = host();
    return (
      preferences.localAi() &&
      languageModel.state().kind === 'available' &&
      !!editor &&
      !editor.compact() &&
      editor.editable()
    );
  },
  isOpen: open,
  open: () => {
    setOpen(true);
    focusField();
  },
  /** Closes the bar and forgets its run, stopping it. */
  close: () => {
    host()?.stop();
    setRun(undefined);
    setOpen(false);
  },
};

/**
 * Runs the bar's requests through the model and the editor's tools, for as
 * long as the stage lives. Renders nothing.
 */
export function LocalAi(props: {
  tools: readonly AgentTool[];
  compact: Accessor<boolean>;
  pageState: Accessor<EditorPageState>;
}) {
  let controller: AbortController | undefined;

  setHost({
    compact: props.compact,
    editable: () => props.pageState().editable,
    send: request => {
      controller?.abort();
      controller = new AbortController();
      setAsked(request.trim());
      void runAgent(
        {
          provider: chromeProvider,
          // Not through withActivity: the bar lists these calls itself.
          tools: props.tools,
          request: request.trim(),
          signal: controller.signal,
        },
        next => {
          log('run', next.phase.kind, next);
          setRun(next);
        },
      );
    },
    stop: () => controller?.abort(),
  });

  createEffect(() => {
    if (!localAi.enabled()) localAi.close();
  });
  onCleanup(() => {
    controller?.abort();
    setHost(undefined);
  });
  return null;
}

/** Opens the Ask AI bar. Shown only while the bar can run. */
export function AskAiButton() {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Show when={localAi.enabled()}>
      <Button
        size="sm"
        theme="secondary"
        variant="ghost"
        leftIcon={<PromptIcon size={18} />}
        data-ask-ai
        onClick={() => localAi.open()}
      >
        {t('localAi.ask')}
      </Button>
    </Show>
  );
}

/** A call as the agent activity card draws it, or the model's own words. */
function EntryRow(props: {entry: Entry}) {
  const words = useSummaryWords();
  const call = () => (props.entry.kind === 'call' ? props.entry : undefined);
  const note = () => (props.entry.kind === 'note' ? props.entry.text : '');
  return (
    <Show
      when={call()}
      fallback={
        <li class={styles.note} data-local-ai-note>
          {note()}
        </li>
      }
    >
      {entry => (
        <ToolRow
          tool={entry().tool}
          summary={summarize(entry().tool, entry().args, words)}
          status={entry().status}
          error={(() => {
            const now = entry();
            return now.status === 'failed' ? now.error : undefined;
          })()}
          readOnly={entry().readOnly}
        />
      )}
    </Show>
  );
}

/**
 * The request field with Send and Close, in place of the action bar it
 * opened from, and the run's list above it.
 */
export function PromptBar() {
  const [t] = useI18n<AppLocaleEntries>();
  let input!: HTMLTextAreaElement;

  const send = () => {
    if (busy() || !draft().trim()) return;
    host()?.send(draft());
    setDraft('');
  };
  const close = () => {
    localAi.close();
    // The button that opened the bar comes back with the action bar.
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('[data-ask-ai]')?.focus(),
    );
  };

  onMount(() => {
    input.focus({preventScroll: true});
    // App shortcuts listen on the body before Solid's delegated handlers, so
    // the field keeps its keys with a native listener.
    const keys = (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.isComposing
      ) {
        event.preventDefault();
        send();
      }
    };
    input.addEventListener('keydown', keys);
    onCleanup(() => input.removeEventListener('keydown', keys));
  });

  const phase = () => run()?.phase;

  return (
    <div class={styles.slot} data-local-ai>
      <div class={styles.stack}>
        <Show when={run()}>
          {current => (
            <section
              class={styles.panel}
              aria-label={t('localAi.title')}
              data-local-ai-run={current().phase.kind}
            >
              <p class={styles.asked} title={asked()}>
                {asked()}
              </p>
              <ol class={styles.list} aria-label={t('localAi.steps')}>
                {/* By position, so a call that settles updates its row in place. */}
                <Index each={current().entries}>
                  {entry => <EntryRow entry={entry()} />}
                </Index>
              </ol>
              <Show when={phase()?.kind === 'thinking'}>
                <p class={styles.thinking} data-local-ai-thinking>
                  <span class={spinner} />
                  {t('localAi.thinking')}
                </p>
              </Show>
              <Show when={current().text}>
                <p class={styles.answer} data-local-ai-answer>
                  {current().text}
                </p>
              </Show>
              <Switch>
                <Match when={phase()?.kind === 'turn-limit'}>
                  <p class={styles.outcome} role="status" data-failed>
                    {t('localAi.turnLimit', {count: String(MAX_TURNS)})}
                  </p>
                </Match>
                <Match when={phase()?.kind === 'unavailable'}>
                  <p class={styles.outcome} role="status" data-failed>
                    {t('localAi.notReady')}
                  </p>
                  <Button
                    class={styles.panelAction}
                    size="sm"
                    theme="secondary"
                    onClick={() => {
                      localAi.close();
                      settings.open('experiments');
                    }}
                  >
                    {t('editor.openExperiments')}
                  </Button>
                </Match>
                <Match
                  when={(() => {
                    const now = phase();
                    return now?.kind === 'cannot-start'
                      ? now.reason
                      : undefined;
                  })()}
                >
                  {reason => (
                    <p class={styles.outcome} role="status" data-failed>
                      {t(`localAi.cannotStart.${reason()}`)}
                    </p>
                  )}
                </Match>
                <Match
                  when={(() => {
                    const now = phase();
                    return now?.kind === 'failed' ? now.message : undefined;
                  })()}
                >
                  {message => (
                    <p class={styles.outcome} role="status" data-failed>
                      {t('localAi.failed', {message: message()})}
                    </p>
                  )}
                </Match>
              </Switch>
            </section>
          )}
        </Show>
        <form
          class={styles.bar}
          data-local-ai-bar
          onSubmit={event => {
            event.preventDefault();
            send();
          }}
        >
          <TextArea
            size="md"
            ref={element => {
              input = element;
              element.rows = 1;
            }}
            value={draft()}
            onChange={setDraft}
            placeholder={t('localAi.placeholder')}
            options={{autoResize: true, 'aria-label': t('localAi.request')}}
            slotClasses={{root: styles.field, input: styles.input}}
          />
          <IconButton
            type="submit"
            size="sm"
            theme="primary"
            aria-label={t('localAi.send')}
            disabled={busy() || !draft().trim()}
          >
            <ArrowUpIcon size={18} />
          </IconButton>
          <IconButton
            size="sm"
            theme="secondary"
            variant="ghost"
            aria-label={t('common.close')}
            onClick={close}
          >
            <icons.CloseIcon />
          </IconButton>
        </form>
      </div>
    </div>
  );
}
