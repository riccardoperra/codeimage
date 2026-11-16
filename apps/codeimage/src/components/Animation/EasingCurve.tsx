import {curveOf} from '@core/animation/easing';
import type {Easing} from '@core/animation/model';
import {easedProgress} from '@core/animation/timeline';
import {Show} from 'solid-js';
import * as styles from './easing.css';
export function EasingCurve(props: {
  easing: Easing;
  progress?: number | null;
  glyph?: boolean;
  label?: string;
}) {
  const points = () => {
    const [x1, y1, x2, y2] = curveOf(props.easing);
    return [10 + x1 * 80, 90 - y1 * 80, 10 + x2 * 80, 90 - y2 * 80];
  };
  const path = () =>
    `M10 90 C${points()[0]} ${points()[1]}, ${points()[2]} ${points()[3]}, 90 10`;
  const progress = () => props.progress;
  return (
    <svg
      viewBox="0 0 100 100"
      class={props.glyph ? styles.glyph : styles.curve}
      aria-hidden={props.label ? undefined : true}
      role={props.label ? 'img' : undefined}
      aria-label={props.label}
    >
      <Show when={!props.glyph}>
        <path
          class={styles.guide}
          d={`M10 90 L${points()[0]} ${points()[1]} M90 10 L${points()[2]} ${points()[3]}`}
        />
        <circle
          class={styles.point}
          cx={points()[0]}
          cy={points()[1]}
          r={2.5}
        />
        <circle
          class={styles.point}
          cx={points()[2]}
          cy={points()[3]}
          r={2.5}
        />
      </Show>
      <path d={path()} />
      <Show when={progress() !== null && progress() !== undefined}>
        <circle
          class={styles.dot}
          data-easing-dot
          cx={10 + progress()! * 80}
          cy={90 - easedProgress(props.easing, progress()!) * 80}
          r={3}
        />
      </Show>
    </svg>
  );
}
