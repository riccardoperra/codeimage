import {createTimelineInputRef} from './timeline/input';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {EASINGS, transitionOf} from '@codeimage/store/editor/animationSettings';
import {Button, TextField} from '@codeimage/ui';
import {Popover} from '@ui/Popover';
import {
  curveOf,
  easingOf,
  formatPoint,
  parseEasing,
} from '@core/animation/easing';
import type {EasingName} from '@core/animation/model';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createEffect, createSignal, Show, untrack} from 'solid-js';
import type {JSX} from '@solidjs/web';
import type {AppLocaleEntries} from '../../i18n';
import {EasingCurve} from './EasingCurve';
import * as styles from './easing.css';

export function EasingField(props: {
  stepId: string;
  modal?: boolean;
  anchor?: HTMLElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  header?: JSX.Element;
  class?: string;
}) {
  const {animation} = getEditorStore();
  const inputRef = createTimelineInputRef();
  const [t] = useI18n<AppLocaleEntries>();
  const value = createTransitionEasing(() => props.stepId);
  const preset = () => easingPreset(value());
  const [choice, setChoice] = createSignal<EasingName | 'custom'>(
    untrack(preset),
  );
  const [text, setText] = createSignal('');
  const [invalid, setInvalid] = createSignal(false);
  const [ownOpen, setOwnOpen] = createSignal(false);
  const open = () => props.open ?? ownOpen();
  const setOpen = (value: boolean) => {
    setOwnOpen(value);
    props.onOpenChange?.(value);
    if (value) {
      setChoice(preset());
      setInvalid(false);
    }
  };
  createEffect(value, current => {
    setText(
      `cubic-bezier(${curveOf(easingOf(current)).map(formatPoint).join(', ')})`,
    );
    setInvalid(false);
  });
  const choices = () =>
    [...EASINGS, 'custom' as const].map(value => ({
      value,
      label: t(`animation.easing.${value}`),
    }));
  const select = (choice: EasingName | 'custom') => {
    setChoice(choice);
    if (choice !== 'custom')
      animation.actions.setTransition(props.stepId, {easing: choice});
  };
  const commitCustom = () => {
    if (!animation.settings().steps.some(step => step.id === props.stepId))
      return;
    const easing = parseEasing(text());
    setInvalid(easing === null);
    if (easing && easing !== value())
      animation.actions.setTransition(props.stepId, {easing});
  };
  const progress = createTransitionProgress(() => props.stepId);
  const close = () => setOpen(false);
  return (
    <Popover
      open={open()}
      onOpenChange={setOpen}
      modal={props.modal}
      placement={props.anchor ? 'top' : 'top-end'}
      anchor={props.anchor}
      gutter={8}
      overflowPadding={12}
      exitDuration={120}
    >
      <Show when={!props.anchor}>
        <Popover.Trigger
          as={Button}
          size="xs"
          theme="secondary"
          aria-label={t('animation.easing.label')}
          data-easing-trigger
        >
          <EasingCurve easing={easingOf(value())} glyph />
          {t(`animation.easing.${preset()}`)}
        </Popover.Trigger>
      </Show>
      <Popover.Portal>
        <Show when={props.modal && open()}>
          <div class={styles.popoverBackdrop} />
        </Show>
        <Popover.Content
          data-transition-popover={props.anchor ? '' : undefined}
          aria-label={t('animation.easing.label')}
          aria-modal={props.modal ? 'true' : undefined}
          class={styles.content + ' ' + (props.class ?? '')}
          ref={inputRef}
          onOpenAutoFocus={focusEasingChoice}
        >
          <Show when={!props.anchor}>
            <div class={styles.popoverTitle}>{t('animation.easing.label')}</div>
          </Show>
          <div class={styles.body}>
            {props.header}
            <SegmentedField
              itemClass={styles.preset}
              size="xs"
              adapt
              value={choice()}
              onEscape={close}
              onChange={select}
              items={choices()}
            />
            <EasingCurve
              easing={easingOf(value())}
              progress={progress()}
              label={t('animation.curve')}
            />
            <Show when={choice() === 'custom'}>
              <CustomEasingInput
                value={text()}
                invalid={invalid()}
                onChange={setText}
                commit={commitCustom}
              />
            </Show>
            <Button
              class={styles.play}
              size="sm"
              theme="secondary"
              onClick={() => {
                setOpen(false);
                animation.actions.playTransition(props.stepId);
              }}
            >
              {t('animation.playTransition')}
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
}

function focusEasingChoice(event: Event) {
  if (!(event.currentTarget instanceof HTMLElement)) return;
  const selected = event.currentTarget.querySelector<HTMLElement>(
    '[role=tab][aria-selected=true]',
  );
  if (selected) {
    event.preventDefault();
    selected.focus({preventScroll: true});
  }
}

function createTransitionProgress(stepId: () => string) {
  const {animation} = getEditorStore();
  const segment = () =>
    animation
      .segments()
      .find(
        segment => segment.stepId === stepId() && segment.kind === 'transition',
      );
  return () => {
    const current = segment();
    const at = animation.playhead();
    return current &&
      at >= current.startMs &&
      at <= current.startMs + current.durationMs
      ? (at - current.startMs) / current.durationMs
      : null;
  };
}

function easingPreset(current: string): EasingName | 'custom' {
  switch (current) {
    case 'smooth':
    case 'snappy':
    case 'strong':
    case 'linear':
      return current;
    default:
      return 'custom';
  }
}

function CustomEasingInput(props: {
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
  commit: () => void;
}) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <div
      onKeyDown={event => commitOnEnter(event, props.commit)}
      onFocusOut={() => props.commit()}
    >
      <TextField
        type="text"
        id="animationCustomEasing"
        size="xs"
        aria-label={t('animation.easing.custom')}
        value={props.value}
        onChange={props.onChange}
        aria-invalid={props.invalid ? 'true' : 'false'}
        aria-describedby={props.invalid ? 'animationCurveError' : undefined}
      />
      <Show when={props.invalid}>
        <div class={styles.validationError} id="animationCurveError">
          {t('animation.invalidCurve')}
        </div>
      </Show>
    </div>
  );
}

function commitOnEnter(event: KeyboardEvent, commit: () => void) {
  if (event.key === 'Escape') return;
  event.stopPropagation();
  if (event.key === 'Enter') {
    event.preventDefault();
    commit();
  }
}
function createTransitionEasing(stepId: () => string) {
  const {animation} = getEditorStore();
  const step = () =>
    animation.settings().steps.find(step => step.id === stepId());
  return () => {
    const selected = step();
    return selected
      ? transitionOf(animation.settings(), selected).easing
      : animation.settings().easing;
  };
}
