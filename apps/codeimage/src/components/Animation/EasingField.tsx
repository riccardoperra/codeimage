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
import {createEffect, createSignal, on, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {EasingCurve} from './EasingCurve';
import * as styles from './easing.css';
export function EasingField(props: {stepId: string; modal?: boolean}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const step = () =>
    animation.settings().steps.find(step => step.id === props.stepId)!;
  const value = () => transitionOf(animation.settings(), step()).easing;
  const preset = (): EasingName | 'custom' => {
    const current = value();
    return current === 'smooth' ||
      current === 'snappy' ||
      current === 'strong' ||
      current === 'linear'
      ? current
      : 'custom';
  };
  const [choice, setChoice] = createSignal<EasingName | 'custom'>(preset());
  const [text, setText] = createSignal('');
  const [invalid, setInvalid] = createSignal(false);
  const [open, setOpen] = createSignal(false);
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
  const customKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') return;
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      commitCustom();
    }
  };
  const autofocus = (event: Event) => {
    event.preventDefault();
    requestAnimationFrame(() =>
      content
        ?.querySelector<HTMLElement>('[role=tab][aria-selected=true]')
        ?.focus(),
    );
  };
  const openChange = (value: boolean) => {
    setOpen(value);
    if (value) {
      setChoice(preset());
      setInvalid(false);
    }
  };
  const segment = () =>
    animation
      .segments()
      .find(
        segment =>
          segment.stepId === props.stepId && segment.kind === 'transition',
      );
  const progress = () => {
    const current = segment();
    const at = animation.playhead();
    return current &&
      at >= current.startMs &&
      at <= current.startMs + current.durationMs
      ? (at - current.startMs) / current.durationMs
      : null;
  };
  const close = () => setOpen(false);
  const play = () => {
    setOpen(false);
    animation.actions.playTransition(props.stepId);
  };
  return (
    <Popover
      open={open()}
      onOpenChange={openChange}
      placement="top-end"
      slide
      overflowPadding={8}
      modal={props.modal}
    >
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
      <PopoverContent
        title={t('animation.easing.label')}
        class={styles.content}
        ref={content}
        onOpenAutoFocus={autofocus}
      >
        <SegmentedField
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
          <div on:keydown={customKeyDown} onFocusOut={commitCustom}>
            <TextField
              id="animationCustomEasing"
              size="xs"
              label={t('animation.easing.custom')}
              value={text()}
              onChange={setText}
              validationState={invalid() ? 'invalid' : 'valid'}
              errorMessage={invalid() ? t('animation.invalidCurve') : undefined}
            />
          </div>
        </Show>
        <Button size="sm" theme="secondary" onClick={play}>
          {t('animation.playTransition')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
