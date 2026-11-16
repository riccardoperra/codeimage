import {useI18n} from '@codeimage/locale';
import {Button, IconButton, icons, TextArea} from '@codeui/kit';
import type {Accessor} from 'solid-js';
import {
  createEffect,
  createSignal,
  Index,
  Match,
  on,
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
import {ArrowUpIcon} from '../shell/icons';
import {preferences} from '../shell/preferences';
import {settings} from '../shell/settings-state';
import type {Entry, Run} from './agent';
import {createChat, initialRun, MAX_TURNS} from './agent';
import {log} from './language-model';
import {languageModel, localAiProvider} from './providers';
import * as styles from './local-ai.css';

/** What the bar needs from the editor it sits in. */
interface Host {
  readonly compact: Accessor<boolean>;
  readonly editable: Accessor<boolean>;
  readonly send: (request: string) => void;
  /** Stops the running request and forgets the conversation. */
  readonly end: () => void;
}

/** A request and its run, one block of the conversation. */
interface Exchange {
  readonly request: string;
  readonly run: Run;
}

const [host, setHost] = createSignal<Host>();
const [open, setOpen] = createSignal(false);
const [draft, setDraft] = createSignal('');
const [exchanges, setExchanges] = createSignal<readonly Exchange[]>([]);

const busy = () => {
  const phase = exchanges().at(-1)?.run.phase.kind;
  return phase === 'thinking' || phase === 'calling';
};

const endChat = () => {
  host()?.end();
  setExchanges([]);
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
  /** Closes the bar and ends its conversation, stopping a running request. */
  close: () => {
    endChat();
    setOpen(false);
  },
};

/**
 * Runs the bar's requests through the model and the editor's tools, for as
 * long as the stage lives. Renders nothing.
 */
export function LocalAi(props: {
  tools: readonly AgentTool[];
  brief: () => Record<string, unknown>;
  compact: Accessor<boolean>;
  pageState: Accessor<EditorPageState>;
}) {
  let controller: AbortController | undefined;
  const chat = createChat({
    provider: localAiProvider,
    // Not through withActivity: the bar lists these calls itself.
    tools: props.tools,
    brief: props.brief,
  });
  const end = () => {
    controller?.abort();
    chat.end();
  };

  setHost({
    compact: props.compact,
    editable: () => props.pageState().editable,
    send: text => {
      controller?.abort();
      controller = new AbortController();
      const request = text.trim();
      let exchange: Exchange = {request, run: initialRun};
      setExchanges(list => [...list, exchange]);
      void chat.send(request, controller.signal, next => {
        log('run', next.phase.kind, next);
        const old = exchange;
        exchange = {request, run: next};
        // By identity, so a run that a new chat cut short changes nothing.
        setExchanges(list =>
          list.map(item => (item === old ? exchange : item)),
        );
      });
    },
    end,
  });

  createEffect(() => {
    if (!localAi.enabled()) localAi.close();
  });
  // A conversation lives in one provider's session.
  createEffect(on(preferences.localAiProvider, endChat, {defer: true}));
  onCleanup(() => {
    end();
    setExchanges([]);
    setHost(undefined);
  });
  return null;
}

/** Opens the Ask AI bar. Shown only while the bar can run. */
/** A call as the agent activity card draws it, or the model's own words. */
function EntryRow(props: {entry: Entry}) {
  const words = useSummaryWords();
  const [t] = useI18n<AppLocaleEntries>();
  const call = () => (props.entry.kind === 'call' ? props.entry : undefined);
  const note = () => (props.entry.kind === 'note' ? props.entry.text : '');
  return (
    <Show
      when={call()}
      fallback={
        <Show
          when={props.entry.kind === 'chat-full'}
          fallback={
            <li class={styles.note} data-local-ai-note>
              {note()}
            </li>
          }
        >
          <li class={styles.notice} role="status" data-local-ai-chat-full>
            {t('localAi.chatFull')}
          </li>
        </Show>
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
          tabId={entry().tabId}
        />
      )}
    </Show>
  );
}

/** The model's answer as plain text, three lines until the user asks for all. */
function Answer(props: {text: string}) {
  const [t] = useI18n<AppLocaleEntries>();
  const [expanded, setExpanded] = createSignal(false);
  const [clipped, setClipped] = createSignal(false);
  let paragraph!: HTMLParagraphElement;
  createEffect(() => {
    void props.text;
    if (expanded()) return;
    // Glyphs can overhang the clamped box by a few pixels; a hidden line is
    // a whole line height.
    const line = parseFloat(getComputedStyle(paragraph).lineHeight) || 16;
    setClipped(paragraph.scrollHeight - paragraph.clientHeight > line / 2);
  });
  return (
    <>
      <p
        ref={paragraph}
        class={styles.answer}
        data-local-ai-answer
        data-clamped={expanded() ? undefined : ''}
      >
        {props.text}
      </p>
      <Show when={clipped()}>
        <Button
          class={styles.panelAction}
          size="xs"
          theme="secondary"
          variant="ghost"
          aria-expanded={expanded()}
          data-local-ai-show-all
          onClick={() => setExpanded(open => !open)}
        >
          {expanded() ? t('localAi.showLess') : t('localAi.showAll')}
        </Button>
      </Show>
    </>
  );
}

/** One request of the conversation: its words, its calls and the answer. */
function Block(props: {exchange: Exchange; earlier: boolean}) {
  const [t] = useI18n<AppLocaleEntries>();
  const phase = () => props.exchange.run.phase;
  return (
    <article
      class={styles.block}
      data-local-ai-run={phase().kind}
      data-earlier={props.earlier ? '' : undefined}
    >
      <p class={styles.asked} title={props.exchange.request}>
        {props.exchange.request}
      </p>
      <ol class={styles.list} aria-label={t('localAi.steps')}>
        {/* By position, so a call that settles updates its row in place. */}
        <Index each={props.exchange.run.entries}>
          {entry => <EntryRow entry={entry()} />}
        </Index>
      </ol>
      <Show when={phase().kind === 'thinking'}>
        <p class={styles.thinking} data-local-ai-thinking>
          <span class={spinner} />
          {t('localAi.thinking')}
        </p>
      </Show>
      <Show when={props.exchange.run.text}>
        {text => <Answer text={text()} />}
      </Show>
      <Switch>
        <Match when={phase().kind === 'turn-limit'}>
          <p class={styles.outcome} role="status" data-failed>
            {t('localAi.turnLimit', {count: String(MAX_TURNS)})}
          </p>
        </Match>
        <Match when={phase().kind === 'unavailable'}>
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
            return now.kind === 'cannot-start' ? now.reason : undefined;
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
            return now.kind === 'failed' ? now.message : undefined;
          })()}
        >
          {message => (
            <p class={styles.outcome} role="status" data-failed>
              {t('localAi.failed', {message: message()})}
            </p>
          )}
        </Match>
      </Switch>
    </article>
  );
}

/**
 * The request field with Send and Close, in place of the action bar it
 * opened from, and the conversation above it.
 */
export function PromptBar() {
  const [t] = useI18n<AppLocaleEntries>();
  let input!: HTMLTextAreaElement;
  let panel: HTMLElement | undefined;
  // Follows the latest block unless the user scrolled up to read.
  let follow = true;

  const send = () => {
    if (busy() || !draft().trim()) return;
    follow = true;
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
  const newChat = () => {
    endChat();
    input.focus();
  };

  createEffect(
    on(exchanges, () => {
      if (panel && follow) panel.scrollTop = panel.scrollHeight;
    }),
  );

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

  return (
    <div class={styles.slot} data-local-ai>
      <div class={styles.stack}>
        <Show when={exchanges().length > 0}>
          <section
            ref={panel}
            class={styles.panel}
            aria-label={t('localAi.title')}
            data-local-ai-chat
            onScroll={event => {
              const {scrollHeight, scrollTop, clientHeight} =
                event.currentTarget;
              follow = scrollHeight - scrollTop - clientHeight < 24;
            }}
          >
            <div class={styles.header}>
              <Button
                size="xs"
                theme="secondary"
                variant="ghost"
                data-local-ai-new-chat
                onClick={newChat}
              >
                {t('localAi.newChat')}
              </Button>
            </div>
            <Index each={exchanges()}>
              {(exchange, index) => (
                <Block
                  exchange={exchange()}
                  earlier={index < exchanges().length - 1}
                />
              )}
            </Index>
          </section>
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
