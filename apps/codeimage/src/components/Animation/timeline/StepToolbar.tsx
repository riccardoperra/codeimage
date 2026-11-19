import type {AnimationSettings} from '@core/animation/model';
import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  type AnimationSegment,
  DURATION_LIMITS,
  transitionOf,
} from '@codeimage/store/editor/animationSettings';
import {Button} from '@codeimage/ui';
import {Show} from 'solid-js';
import {DurationInput} from '../DurationInput';
import {timelineActions} from './actions';
import {StepMenu} from './StepMenu';
import {LineActions} from './LineActions';
import type {TimelineModel} from './model';
import * as styles from './toolbar.css';

export function StepToolbar(props: {model: TimelineModel; addTab?: boolean}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const actions = timelineActions();
  const selection = () => animation.selection();
  const step = () => {
    const value = selection();
    return value ? props.model.stepOf(value.stepId) : undefined;
  };
  const segment = () =>
    selection()?.kind === 'transition' ? step()?.transition : step()?.hold;
  const commit = (ms: number) => {
    const value = segment();
    if (!value) return;
    if (value.kind === 'hold') animation.actions.setHoldMs(value.stepId, ms);
    else animation.actions.setTransition(value.stepId, {ms});
  };
  const allMatch = () => transitionsMatch(animation.settings(), segment());
  const title = () => {
    const value = step();
    if (!value) return '';
    if (selection()?.kind === 'hold') return value.label;
    const previous = props.model.steps()[value.index - 1];
    return `${previous?.label ?? ''} → ${value.label}`;
  };
  const current = () => {
    const selected = step();
    const selectedSegment = segment();
    return selected && selectedSegment
      ? {step: selected, segment: selectedSegment}
      : undefined;
  };
  return (
    <div class={styles.toolbar} data-step-toolbar>
      <Show
        when={current()}
        fallback={
          <>
            <span class={styles.muted}>
              {t('animation.timeline.selectHint')}
            </span>
            <span class={styles.spacer} />
            <Button
              class={styles.button}
              size="xs"
              theme="secondary"
              disabled={!actions.canAddTab()}
              onClick={actions.addTab}
              data-animation-add-tab
            >
              {t('animation.timeline.addTab')}
            </Button>
          </>
        }
      >
        {current => (
          <>
            <span class={styles.label} data-step-title>
              {title()}
            </span>
            <Show when={selection()?.kind === 'hold'}>
              <DurationInput
                id="animationDuration"
                field="hold"
                label={t('animation.hold')}
                value={current().segment.durationMs}
                limits={DURATION_LIMITS.holdMs}
                commit={commit}
              />
            </Show>
            <Show
              when={
                selection()?.kind === 'hold' &&
                current().step.source.kind === 'script' &&
                current().step.source
              }
              keyed
            >
              {source =>
                source.kind === 'script' && (
                  <LineActions editorId={source.editorId} step={source.step} />
                )
              }
            </Show>
            <Show
              when={selection()?.kind === 'transition' && current().step.stepId}
              keyed
            >
              {stepId => (
                <>
                  <span class={styles.muted}>
                    {t('animation.timeline.transitionHint')}
                  </span>
                  <Button
                    class={styles.button}
                    size="xs"
                    theme="secondary"
                    variant="link"
                    aria-disabled={allMatch() ? 'true' : 'false'}
                    data-disabled={allMatch() ? '' : undefined}
                    onClick={() => {
                      if (!allMatch()) animation.actions.applyToAll(stepId);
                    }}
                  >
                    {t('animation.applyAll')}
                  </Button>
                </>
              )}
            </Show>
            <span class={styles.spacer} />
            <Button
              class={styles.button}
              size="xs"
              theme="secondary"
              onClick={() => actions.addStep(current().step.editorId)}
              data-add-script-step={current().step.editorId}
            >
              {t('animation.timeline.addStep')}
            </Button>
            <Show when={props.addTab}>
              <Button
                class={styles.button}
                size="xs"
                theme="secondary"
                variant="link"
                disabled={!actions.canAddTab()}
                onClick={actions.addTab}
                data-animation-add-tab
              >
                {t('animation.timeline.addTab')}
              </Button>
            </Show>
            <StepMenu step={current().step} model={props.model} />
          </>
        )}
      </Show>
    </div>
  );
}

function transitionsMatch(
  settings: AnimationSettings,
  value: AnimationSegment | null | undefined,
) {
  if (!value) return true;
  const transition = transitionOf(settings, settings.steps[value.index]);
  return (
    settings.transitionMs === transition.ms &&
    settings.easing === transition.easing &&
    settings.steps.slice(1).every(step => {
      const other = transitionOf(settings, step);
      return other.ms === transition.ms && other.easing === transition.easing;
    })
  );
}
