import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  DURATION_LIMITS,
  transitionOf,
} from '@codeimage/store/editor/animationSettings';
import {Button, Popover, PopoverContent} from '@codeui/kit';
import {easingOf} from '@core/animation/easing';
import {Dialog} from '@kobalte/core/dialog';
import {createEffect, createSignal, For, on, Show, type JSX} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {EasingCurve} from '../EasingCurve';
import {EasingField} from '../EasingField';
import {DurationInput} from '../SegmentDetails';
import {phone} from './variant';
import * as styles from './proto.css';

export const shortMs = (ms: number) =>
  ms < 1000 ? `${ms} ms` : `${+(ms / 1000).toFixed(ms % 100 ? 2 : 1)} s`;

function useStep(stepId: () => string | null) {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const index = () =>
    animation.settings().steps.findIndex(step => step.id === stepId());
  const step = () => animation.settings().steps[index()];
  const name = () =>
    editor.state.editors.find(tab => tab.id === step()?.editorId)?.tab
      .tabName || t('animation.untitledTab');
  return {index, step, name};
}

function StepEditor(props: {stepId: string; close: () => void}) {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const {index, step, name} = useStep(() => props.stepId);
  const transition = () =>
    step() ? transitionOf(animation.settings(), step()!) : null;
  const allMatch = () => {
    const settings = animation.settings();
    const value = transition();
    if (!value) return true;
    return (
      settings.transitionMs === value.ms &&
      settings.easing === value.easing &&
      settings.steps.slice(1).every(other => {
        const x = transitionOf(settings, other);
        return x.ms === value.ms && x.easing === value.easing;
      })
    );
  };
  const last = () => index() === animation.settings().steps.length - 1;
  return (
    <Show when={step()}>
      <div class={styles.editor} data-proto-step-editor>
        <div class={styles.editorRow}>
          <h3 class={styles.editorTitle}>
            {t('animation.stepName', {n: String(index() + 1), tab: name()})}
          </h3>
          <Show when={phone()}>
            <Button size="xs" theme="primary" onClick={() => props.close()}>
              Done
            </Button>
          </Show>
        </div>
        <div class={styles.editorRow}>
          <DurationInput
            id="protoHold"
            label={t('animation.hold')}
            value={step()!.holdMs}
            limits={DURATION_LIMITS.holdMs}
            commit={ms => animation.actions.setHoldMs(props.stepId, ms)}
          />
        </div>
        <Show when={index() > 0}>
          <div class={styles.editorSection}>
            <p class={styles.sectionLabel}>
              {t('animation.betweenSteps', {
                from: String(index()),
                to: String(index() + 1),
              })}
            </p>
            <div class={styles.editorRow}>
              <DurationInput
                id="protoTransition"
                label={t('animation.transition')}
                value={transition()!.ms}
                limits={DURATION_LIMITS.transitionMs}
                commit={ms =>
                  animation.actions.setTransition(props.stepId, {ms})
                }
              />
            </div>
            <div class={styles.editorRow}>
              <EasingField stepId={props.stepId} />
              <Button
                size="xs"
                theme="secondary"
                aria-disabled={allMatch()}
                data-disabled={allMatch() ? '' : undefined}
                onClick={() =>
                  !allMatch() && animation.actions.applyToAll(props.stepId)
                }
              >
                {t('animation.applyAll')}
              </Button>
            </div>
          </div>
        </Show>
        <div class={`${styles.editorSection}`}>
          <div class={styles.actions}>
            <Button
              size="xs"
              theme="secondary"
              disabled={index() <= 0}
              onClick={() => animation.actions.moveStep(props.stepId, -1)}
            >
              {t('animation.moveEarlier')}
            </Button>
            <Button
              size="xs"
              theme="secondary"
              disabled={last()}
              onClick={() => animation.actions.moveStep(props.stepId, 1)}
            >
              {t('animation.moveLater')}
            </Button>
            <Button
              size="xs"
              theme="secondary"
              disabled={!editor.computed.canAddEditor()}
              onClick={() => {
                animation.actions.duplicateAsNext(props.stepId);
                props.close();
              }}
            >
              {t('animation.duplicate')}
            </Button>
            <Button
              size="xs"
              theme="secondary"
              disabled={animation.settings().steps.length === 1}
              onClick={() => {
                animation.actions.removeStep(props.stepId);
                props.close();
              }}
            >
              {t('animation.remove')}
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
}

function Row(props: {
  stepId: string;
  readOnly?: boolean;
  open: (stepId: string, anchor: HTMLElement) => void;
}) {
  const {animation} = getEditorStore();
  const {index, step, name} = useStep(() => props.stepId);
  let el!: HTMLButtonElement;
  const transition = () =>
    index() > 0 ? transitionOf(animation.settings(), step()!) : null;
  const current = () =>
    animation.playback().state !== 'editing' &&
    animation.currentStep() === index();
  const selected = () =>
    !props.readOnly && animation.selection()?.stepId === props.stepId;
  createEffect(
    on([current, selected], ([isCurrent, isSelected]) => {
      if (isCurrent || isSelected) el.scrollIntoView({block: 'nearest'});
    }),
  );
  const click = () => {
    if (props.readOnly) {
      const hold = animation
        .segments()
        .find(s => s.kind === 'hold' && s.stepId === props.stepId);
      if (hold) animation.actions.seek(hold.startMs);
      return;
    }
    animation.actions.select({stepId: props.stepId, kind: 'hold'});
    props.open(props.stepId, el);
  };
  return (
    <button
      ref={el}
      type="button"
      class={styles.row}
      data-proto-step-row
      data-step-id={props.stepId}
      data-current={current() ? '' : undefined}
      data-selected={selected() ? '' : undefined}
      data-readonly={props.readOnly ? '' : undefined}
      onClick={click}
    >
      <span class={styles.index}>{index() + 1}</span>
      <span class={styles.name}>{name()}</span>
      <span class={styles.metric}>
        <Show
          when={transition()}
          fallback={<span class={styles.muted}>·</span>}
        >
          {value => (
            <>
              <EasingCurve easing={easingOf(value().easing)} glyph />
              {shortMs(value().ms)}
            </>
          )}
        </Show>
      </span>
      <span class={styles.metric}>
        <span class={styles.unit}>hold</span>
        {shortMs(step()?.holdMs ?? 0)}
      </span>
    </button>
  );
}

export function StepList(props: {readOnly?: boolean; header?: JSX.Element}) {
  const {animation} = getEditorStore();
  const [openId, setOpenId] = createSignal<string | null>(null);
  const [anchor, setAnchor] = createSignal<HTMLElement>();
  const open = (stepId: string, element: HTMLElement) => {
    setAnchor(element);
    setOpenId(stepId);
  };
  const close = () => setOpenId(null);
  const ids = () => animation.settings().steps.map(step => step.id);
  return (
    <>
      <div class={styles.listHead} aria-hidden="true">
        <span>#</span>
        <span>Tab</span>
        <span style={{'text-align': 'right'}}>In</span>
        <span style={{'text-align': 'right'}}>Hold</span>
      </div>
      <div class={styles.list} data-proto-step-list>
        <For each={ids()}>
          {id => <Row stepId={id} readOnly={props.readOnly} open={open} />}
        </For>
      </div>
      <Show when={!props.readOnly}>
        <Show
          when={phone()}
          fallback={
            <Popover
              open={!!openId()}
              onOpenChange={value => !value && close()}
              anchorRef={anchor}
              placement="top"
              gutter={6}
            >
              <PopoverContent
                class={styles.popover}
                onOpenAutoFocus={event => event.preventDefault()}
              >
                <Show when={openId()} keyed>
                  {id => <StepEditor stepId={id} close={close} />}
                </Show>
              </PopoverContent>
            </Popover>
          }
        >
          <Dialog open={!!openId()} onOpenChange={value => !value && close()}>
            <Dialog.Portal>
              <Dialog.Overlay class={styles.overlay} />
              <Dialog.Content
                class={styles.sheet}
                data-proto-sheet
                onOpenAutoFocus={event => {
                  event.preventDefault();
                  (event.currentTarget as HTMLElement | null)?.focus();
                }}
              >
                <div class={styles.grabber} />
                <Show when={openId()} keyed>
                  {id => <StepEditor stepId={id} close={close} />}
                </Show>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>
        </Show>
      </Show>
    </>
  );
}
