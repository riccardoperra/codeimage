import type {ParentProps} from 'solid-js';
import {createEffect, createSignal, onSettled, Show, untrack} from 'solid-js';
import * as styles from './Transition.css';

interface TransitionProps extends ParentProps {
  show: boolean;
  afterLeave?: () => void;
  class?: string;
}

interface FadeProps extends TransitionProps {
  duration: number;
  transitionClass: string;
}

function Fade(props: FadeProps) {
  const [mounted, setMounted] = createSignal(untrack(() => props.show));
  const [animated, setAnimated] = createSignal(false);

  onSettled(() => {
    setAnimated(true);
  });

  createEffect(
    () => [props.show, props.duration, props.afterLeave] as const,
    ([show, duration, afterLeave], previous) => {
      if (show) {
        setMounted(true);
        return;
      }
      if (!previous?.[0]) return;
      const delay = matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : duration;
      const timeout = setTimeout(() => {
        setMounted(false);
        afterLeave?.();
      }, delay);
      return () => clearTimeout(timeout);
    },
  );

  const phase = () => {
    if (!animated()) return;
    return props.show ? 'enter' : 'leave';
  };

  return (
    <Show when={mounted()}>
      <div
        class={[props.transitionClass, props.class].filter(Boolean).join(' ')}
        data-transition={phase()}
      >
        {props.children}
      </div>
    </Show>
  );
}

export function FadeInOutTransition(props: TransitionProps) {
  return (
    <Fade
      {...props}
      duration={styles.fadeDuration}
      transitionClass={styles.fadeInOut}
    />
  );
}

export function FadeInOutWithScaleTransition(props: TransitionProps) {
  return (
    <Fade
      {...props}
      duration={styles.scaleDuration}
      transitionClass={styles.fadeInOutWithScale}
    />
  );
}
