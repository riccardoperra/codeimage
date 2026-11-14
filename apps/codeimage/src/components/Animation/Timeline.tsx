import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {For} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import * as styles from './Timeline.css';

export const formatSeconds = (ms: number) =>
  `${Number((ms / 1000).toFixed(2))} s`;

// The scrubber. Each hold and transition takes width in proportion to its
// duration, and dragging anywhere moves the playhead there.
export function Timeline() {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const duration = () => animation.durationMs();
  const percent = (ms: number) => `${(100 * ms) / duration()}%`;

  const timeAt = (track: HTMLElement, clientX: number) => {
    const {left, width} = track.getBoundingClientRect();
    return ((clientX - left) / width) * duration();
  };

  const onPointerDown = (
    event: PointerEvent & {currentTarget: HTMLElement},
  ) => {
    const track = event.currentTarget;
    track.setPointerCapture(event.pointerId);
    track.focus();
    animation.actions.scrub(timeAt(track, event.clientX));
  };
  const onPointerMove = (
    event: PointerEvent & {currentTarget: HTMLElement},
  ) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    animation.actions.scrub(timeAt(event.currentTarget, event.clientX));
  };
  const onPointerUp = (event: PointerEvent & {currentTarget: HTMLElement}) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    animation.actions.seek(timeAt(event.currentTarget, event.clientX));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const frameMs = 1000 / animation.settings().fps;
    const at = animation.playhead();
    const target = {
      ArrowLeft: at - frameMs,
      ArrowRight: at + frameMs,
      PageDown: at - 1000,
      PageUp: at + 1000,
      Home: 0,
      End: duration(),
    }[event.key];
    if (event.key === ' ') animation.actions.toggle();
    else if (target !== undefined) animation.actions.seek(target);
    else return;
    event.preventDefault();
  };

  return (
    <div
      class={styles.track}
      role={'slider'}
      tabIndex={0}
      aria-label={t('animation.playhead')}
      aria-valuemin={0}
      aria-valuemax={duration()}
      aria-valuenow={Math.round(animation.playhead())}
      aria-valuetext={`${formatSeconds(animation.playhead())} / ${formatSeconds(duration())}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div class={styles.bar}>
        <For each={animation.settings().steps}>
          {(step, index) => (
            <>
              <div class={styles.hold} style={{width: percent(step.holdMs)}} />
              {index() < animation.settings().steps.length - 1 && (
                <div
                  class={styles.transition}
                  style={{width: percent(animation.settings().transitionMs)}}
                />
              )}
            </>
          )}
        </For>
      </div>
      <div class={styles.thumb} style={{left: percent(animation.playhead())}} />
    </div>
  );
}
