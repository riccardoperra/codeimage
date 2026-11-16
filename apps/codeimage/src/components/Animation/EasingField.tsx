import {trackTimelineInput} from './timeline/motion';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {EASINGS, transitionOf} from '@codeimage/store/editor/animationSettings';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  TextField,
} from '@codeui/kit';
import {
  curveOf,
  easingOf,
  formatPoint,
  parseEasing,
} from '@core/animation/easing';
import type {EasingName} from '@core/animation/model';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createEffect, createSignal, on, Show, type JSX} from 'solid-js';
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
  const [t] = useI18n<AppLocaleEntries>();
  const value = createTransitionEasing(() => props.stepId);
  const preset = () => easingPreset(value());
  const [choice, setChoice] = createSignal<EasingName | 'custom'>(preset());
  const [text, setText] = createSignal('');
  const [invalid, setInvalid] = createSignal(false);
  const [ownOpen, setOwnOpen] = createSignal(false);
  const open = () => props.open ?? ownOpen();
  const setOpen = (value: boolean) => {
    setOwnOpen(value);
    props.onOpenChange?.(value);
  };
  let content: HTMLDivElement | undefined;
  createEffect(
    on(value, () => {
      setText(
        `cubic-bezier(${curveOf(easingOf(value())).map(formatPoint).join(', ')})`,
      );
      setInvalid(false);
    }),
  );
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
  const openChange = (value: boolean) => {
    setOpen(value);
    if (value) {
      setChoice(preset());
      setInvalid(false);
    }
  };
  const progress = createTransitionProgress(() => props.stepId);
  const close = () => setOpen(false);
  return (
    <Popover
      open={open()}
      onOpenChange={openChange}
      placement={props.anchor ? 'top' : 'top-end'}
      anchorRef={() => props.anchor}
      modal={props.modal}
    >
      <Show when={!props.anchor}>
        <PopoverTrigger
          as={Button}
          size="xs"
          theme="secondary"
          aria-label={t('animation.easing.label')}
          data-easing-trigger
        >
          <EasingCurve easing={easingOf(value())} glyph />
          {t(`animation.easing.${preset()}`)}
        </PopoverTrigger>
      </Show>
      <PopoverContent
        data-transition-popover={props.anchor ? '' : undefined}
        aria-label={t('animation.easing.label')}
        title={props.anchor ? undefined : t('animation.easing.label')}
        class={`${styles.content} ${props.class ?? ''}`}
        ref={element => {
          content = element;
          trackTimelineInput(element);
        }}
        onOpenAutoFocus={event => autofocus(event, content)}
        onCloseAutoFocus={(event: Event) => {
          if (!props.anchor) return;
          event.preventDefault();
          props.anchor.focus({preventScroll: true});
        }}
      >
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
            <div
              on:keydown={event => commitOnEnter(event, commitCustom)}
              onFocusOut={commitCustom}
            >
              <TextField
                id="animationCustomEasing"
                size="xs"
                label={t('animation.easing.custom')}
                value={text()}
                onChange={setText}
                validationState={invalid() ? 'invalid' : 'valid'}
                errorMessage={
                  invalid() ? t('animation.invalidCurve') : undefined
                }
              />
            </div>
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
      </PopoverContent>
    </Popover>
  );
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

function commitOnEnter(event: KeyboardEvent, commit: () => void) {
  if (event.key === 'Escape') return;
  event.stopPropagation();
  if (event.key === 'Enter') {
    event.preventDefault();
    commit();
  }
}
function autofocus(event: Event, content: HTMLDivElement | undefined) {
  event.preventDefault();
  requestAnimationFrame(() =>
    content
      ?.querySelector<HTMLElement>('[role=tab][aria-selected=true]')
      ?.focus(),
  );
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
