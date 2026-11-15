import {getEditorStore} from '@codeimage/store/editor';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createMemo, createSignal, For, onMount} from 'solid-js';
import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../i18n';
import {formatSeconds} from '../format';
import {scaledGeometry} from './geometry';
import * as styles from './proto.css';

/** F: every segment at once, no labels. Drag scrubs, release jumps to that step. */
export function Overview() {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  let el!: HTMLDivElement;
  const [width, setWidth] = createSignal(0);
  onMount(() =>
    createResizeObserver(
      () => el,
      () => setWidth(el.clientWidth),
    ),
  );
  const geometry = createMemo(() =>
    scaledGeometry(animation.segments(), {
      width: width(),
      min: 2,
      gap: animation.segments().length > 40 ? 1 : 2,
    }),
  );
  const at = (event: PointerEvent) =>
    geometry().xToTime(event.clientX - el.getBoundingClientRect().left);
  const down = (event: PointerEvent) => {
    event.preventDefault();
    el.focus();
    el.setPointerCapture(event.pointerId);
    animation.actions.scrub(at(event));
  };
  const move = (event: PointerEvent) => {
    if (el.hasPointerCapture(event.pointerId))
      animation.actions.scrub(at(event));
  };
  const up = (event: PointerEvent) => {
    if (!el.hasPointerCapture(event.pointerId)) return;
    animation.actions.seek(at(event));
    el.releasePointerCapture(event.pointerId);
    const step = animation.settings().steps[animation.currentStep()];
    if (step) animation.actions.select({stepId: step.id, kind: 'hold'});
  };
  const currentIndex = () =>
    animation.playback().state === 'editing' ? -1 : animation.currentStep();
  return (
    <div
      ref={el}
      class={styles.overview}
      role="slider"
      tabIndex={0}
      aria-label={t('animation.playhead')}
      aria-valuemin={0}
      aria-valuemax={animation.durationMs()}
      aria-valuenow={Math.round(animation.playhead())}
      aria-valuetext={formatSeconds(animation.playhead(), locale())}
      data-proto-overview
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <For each={geometry().entries}>
        {entry => (
          <span
            class={styles.overviewSegment}
            data-kind={entry.segment.kind}
            data-current={
              entry.segment.kind === 'hold' &&
              entry.segment.index === currentIndex()
                ? ''
                : undefined
            }
            data-selected={
              entry.segment.kind === 'hold' &&
              animation.selection()?.stepId === entry.segment.stepId
                ? ''
                : undefined
            }
            style={assignInlineVars({
              [styles.start]: `${entry.x}px`,
              [styles.size]: `${entry.width}px`,
            })}
          />
        )}
      </For>
      <span
        class={styles.overviewPlayhead}
        style={assignInlineVars({
          [styles.position]: `${geometry().timeToX(animation.playhead())}px`,
        })}
      />
    </div>
  );
}
