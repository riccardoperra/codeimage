import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {For} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {formatSeconds} from '../format';
import * as styles from './proto.css';

/** Time-linear progress bar. Notches mark where each step's code appears. */
export function Scrubber() {
  const {animation} = getEditorStore();
  const [t, {locale}] = useI18n<AppLocaleEntries>();
  let bar!: HTMLDivElement;
  const pct = (ms: number) =>
    `${(ms / Math.max(1, animation.durationMs())) * 100}%`;
  const at = (event: PointerEvent) => {
    const box = bar.getBoundingClientRect();
    return (
      Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)) *
      animation.durationMs()
    );
  };
  const notches = () =>
    animation
      .segments()
      .filter(segment => segment.kind === 'hold' && segment.index > 0)
      .map(segment => segment.startMs);
  const down = (event: PointerEvent) => {
    event.preventDefault();
    bar.focus();
    bar.setPointerCapture(event.pointerId);
    animation.actions.scrub(at(event));
  };
  const move = (event: PointerEvent) => {
    if (bar.hasPointerCapture(event.pointerId))
      animation.actions.scrub(at(event));
  };
  const up = (event: PointerEvent) => {
    if (!bar.hasPointerCapture(event.pointerId)) return;
    animation.actions.seek(at(event));
    bar.releasePointerCapture(event.pointerId);
  };
  const keyDown = (event: KeyboardEvent) => {
    const amount = event.shiftKey ? 100 : 1000 / animation.settings().fps;
    if (event.key === 'ArrowLeft')
      animation.actions.seek(animation.playhead() - amount);
    else if (event.key === 'ArrowRight')
      animation.actions.seek(animation.playhead() + amount);
    else return;
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <div
      ref={bar}
      class={styles.scrubber}
      role="slider"
      tabIndex={0}
      aria-label={t('animation.playhead')}
      aria-valuemin={0}
      aria-valuemax={animation.durationMs()}
      aria-valuenow={Math.round(animation.playhead())}
      aria-valuetext={formatSeconds(animation.playhead(), locale())}
      data-proto-scrubber
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      on:keydown={keyDown}
    >
      <div class={styles.scrubTrack}>
        <div
          class={styles.scrubFill}
          style={assignInlineVars({
            [styles.position]: pct(animation.playhead()),
          })}
        />
      </div>
      <For each={notches()}>
        {ms => (
          <span
            class={styles.scrubNotch}
            style={assignInlineVars({[styles.position]: pct(ms)})}
          />
        )}
      </For>
      <span
        class={styles.scrubKnob}
        style={assignInlineVars({
          [styles.position]: pct(animation.playhead()),
        })}
      />
    </div>
  );
}
