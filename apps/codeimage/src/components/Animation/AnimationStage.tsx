import {useI18n} from '@codeimage/locale';

import {getEditorStore} from '@codeimage/store/editor';
import {getFrameState} from '@codeimage/store/editor/frame';

import {createEffect, onCleanup, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';

import * as styles from './AnimationPreview.css';

import {type PreviewPlan} from './planPreview';
import {AnimationScenes} from './AnimationScenes';
export function AnimationStage(props: {
  plan: PreviewPlan | undefined;
  visible: boolean;
  focus: boolean;
  onFocused: () => void;
}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  let stage: HTMLDivElement | undefined;
  createEffect(() => {
    if (!props.visible || !props.focus) return;
    const request = requestAnimationFrame(() => {
      stage?.focus({preventScroll: true});
      props.onFocused();
    });
    onCleanup(() => cancelAnimationFrame(request));
  });
  const target = () => getFrameState().exportTarget();
  const zoom = () => {
    const current = target();
    return current
      ? Math.min(640, current.resolution[0]) / current.resolution[0]
      : undefined;
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const frameMs = 1000 / animation.settings().fps;
    if (event.key === ' ') animation.actions.toggle();
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const amount = event.shiftKey ? 100 : frameMs;
      const step = event.key === 'ArrowLeft' ? -amount : amount;
      animation.actions.seek(animation.playhead() + step);
    } else if (event.key === 'Escape' || event.key === 'Enter') {
      animation.actions.editStep(animation.currentStep());
    } else if (event.key.length === 1)
      animation.actions.editStep(animation.currentStep(), event.key);
    else return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      data-animation-stage
      ref={stage}
      class={styles.stage}
      tabIndex={0}
      role={'group'}
      aria-roledescription={t('animation.previewRole')}
      aria-label={t('animation.previewLabel')}
      hidden={!props.visible}
      style={{zoom: zoom()}}
      on:keydown={onKeyDown}
    >
      <Show when={props.plan} keyed>
        {plan => <AnimationScenes plan={plan} visible={props.visible} />}
      </Show>
    </div>
  );
}
