import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import {Button, IconButton, icons, TextArea} from '@codeui/kit';
import {Dialog} from '@kobalte/core/dialog';
import {createSignal, For, Match, onCleanup, Show, Switch} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {withActivity} from '../agent-tools/activity';
import type {AgentTool} from '../agent-tools/tools';
import {createEditorReader} from '../agent-tools/tools';
import {useSummaryWords} from '../agent-tools/ToolActivity';
import {describeControl} from '../agent-tools/values';
import type {ListedModel} from '../command-menu/listed-model';
import {commandMenu} from '../command-menu/state';
import type {EditorControlsModel} from '../model';
import {preferences} from '../shell/preferences';
import {settings} from '../shell/settings-state';
import {languageModel, log} from './language-model';
import type {StepResult} from './plan';
import {
  describeSettings,
  extractCodeBlocks,
  parsePlan,
  planSchema,
  plannable,
  requestPrompt,
  runPlan,
  systemPrompt,
} from './plan';
import * as styles from './local-ai.css';

type Phase =
  | {readonly kind: 'idle'}
  | {readonly kind: 'thinking'}
  | {readonly kind: 'running'}
  | {readonly kind: 'failed'; readonly error: string};

const FEATURED = SUPPORTED_LANGUAGES.filter(language => language.featured).map(
  language => language.id,
);

const [open, setOpen] = createSignal(false);

/** The local AI dialog, which the command menu opens. */
export const localAi = {
  /** On when the experiment is on and the model is on this device. */
  enabled: () =>
    preferences.localAi() && languageModel.state().kind === 'available',
  open: () => setOpen(true),
};

export function LocalAi(props: {
  tools: readonly AgentTool[];
  model: EditorControlsModel;
  listed: ListedModel;
}) {
  const [t] = useI18n<AppLocaleEntries>();
  const reader = createEditorReader(props.listed);
  const tools = plannable(
    withActivity(props.tools, 'local-ai', useSummaryWords()),
  );
  const [request, setRequest] = createSignal('');
  const [phase, setPhase] = createSignal<Phase>({kind: 'idle'});
  const [steps, setSteps] = createSignal<readonly StepResult[]>([]);
  const busy = () => phase().kind !== 'idle' && phase().kind !== 'failed';
  const failure = () => {
    const now = phase();
    return now.kind === 'failed' ? now.error : undefined;
  };
  let controller: AbortController | undefined;

  onCleanup(commandMenu.beforeOpen(() => setOpen(false)));
  onCleanup(() => controller?.abort());

  const run = async () => {
    if (busy() || !request().trim()) return;
    controller = new AbortController();
    const {signal} = controller;
    const {text, blocks} = extractCodeBlocks(request());
    setSteps([]);
    setPhase({kind: 'thinking'});
    let session:
      | Awaited<ReturnType<typeof languageModel.openSession>>
      | undefined;
    try {
      const system = systemPrompt(tools, {
        themes: props.model.themes().map(theme => theme.name),
        languages: FEATURED,
        settings: describeSettings(reader.usable().map(describeControl)),
        tabs: reader.tabs(),
      });
      log(`system prompt (${system.length} chars)`, system);
      session = await languageModel.openSession(system, signal);
      const prompt = requestPrompt(text, blocks);
      log('prompt', prompt, 'code blocks', blocks);
      const answer = await session.prompt(prompt, {
        responseConstraint: planSchema(tools),
        signal,
      });
      log('model answer', answer);
      const plan = parsePlan(answer);
      log('plan', plan);
      if (!plan.ok) throw new Error(plan.error);
      if (plan.value.steps.length === 0) {
        setPhase({kind: 'failed', error: t('localAi.noSteps')});
        return;
      }
      setPhase({kind: 'running'});
      await runPlan(plan.value, tools, blocks, step => {
        log('step', step);
        setSteps(done => [...done, step]);
      });
      setPhase({kind: 'idle'});
    } catch (error) {
      log('request failed', error);
      if (signal.aborted) return;
      setPhase({
        kind: 'failed',
        error: t('localAi.failed', {
          message: error instanceof Error ? error.message : String(error),
        }),
      });
    } finally {
      session?.destroy();
    }
  };

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay class={styles.backdrop} />
        <Dialog.Content class={styles.content} data-local-ai>
          <div class={styles.header}>
            <Dialog.Title class={styles.title}>
              {t('localAi.title')}
            </Dialog.Title>
            <Dialog.CloseButton
              as={IconButton}
              size="sm"
              theme="secondary"
              variant="ghost"
              aria-label={t('common.close')}
            >
              <icons.CloseIcon />
            </Dialog.CloseButton>
          </div>
          <Dialog.Description class={styles.intro}>
            {t('localAi.intro')}
          </Dialog.Description>
          <Show
            when={languageModel.state().kind === 'available'}
            fallback={
              <div class={styles.actions}>
                <p class={styles.status}>{t('localAi.notReady')}</p>
                <Button
                  size="sm"
                  theme="secondary"
                  onClick={() => {
                    setOpen(false);
                    settings.open('experiments');
                  }}
                >
                  {t('editor.openExperiments')}
                </Button>
              </div>
            }
          >
            <form
              class={styles.form}
              onSubmit={event => {
                event.preventDefault();
                void run();
              }}
            >
              <TextArea
                label={t('localAi.request')}
                placeholder={t('localAi.placeholder')}
                value={request()}
                onChange={setRequest}
                options={{autoResize: true}}
                slotClasses={{input: styles.request}}
              />
              <div class={styles.actions}>
                <p class={styles.status} role="status">
                  <Switch>
                    <Match when={phase().kind === 'thinking'}>
                      {t('localAi.thinking')}
                    </Match>
                    <Match when={phase().kind === 'running'}>
                      {t('localAi.running')}
                    </Match>
                    <Match when={failure()}>
                      {error => <span class={styles.error}>{error()}</span>}
                    </Match>
                  </Switch>
                </p>
                <Button
                  type="submit"
                  size="sm"
                  theme="primary"
                  loading={busy()}
                  disabled={busy() || !request().trim()}
                >
                  {t('localAi.run')}
                </Button>
              </div>
            </form>
          </Show>
          <ol class={styles.steps} aria-label={t('localAi.steps')}>
            <For each={steps()}>
              {step => (
                <li class={styles.step} data-ok={step.result.ok}>
                  <code class={styles.tool}>{step.tool}</code>
                  <span>
                    {step.result.ok ? t('localAi.done') : step.result.error}
                  </span>
                </li>
              )}
            </For>
          </ol>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
