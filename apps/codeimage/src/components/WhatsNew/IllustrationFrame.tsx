import type {JSX} from '@solidjs/web';
import type {ContentHighlightId} from '@codeimage/store/whats-new/registry';
import {createSignal, onSettled, untrack} from 'solid-js';
import * as styles from './illustrations.css';

type IllustrationMode = 'play' | 'still' | 'thumb';
export interface IllustrationProps {
  readonly mode?: IllustrationMode;
}

export function IllustrationFrame(
  props: IllustrationProps & {id: ContentHighlightId; children: JSX.Element},
) {
  let frame: HTMLDivElement | undefined;
  const [playing, setPlaying] = createSignal<'entrance' | 'scroll'>();
  const shouldPlay = untrack(() => props.mode === 'play');
  const play = (from: 'entrance' | 'scroll') => {
    setPlaying(from);
    requestAnimationFrame(() => {
      if (!frame) return;
      const parts = frame.getAnimations({subtree: true});
      void Promise.allSettled(parts.map(part => part.finished)).then(() =>
        setPlaying(undefined),
      );
    });
  };
  onSettled(() => {
    if (!shouldPlay || !frame) return;
    let first = true;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.some(entry => entry.isIntersecting);
        if (visible) play(first ? 'entrance' : 'scroll');
        first = false;
        if (visible) observer.disconnect();
      },
      {threshold: 0.25},
    );
    observer.observe(frame);
    return () => observer.disconnect();
  });
  return (
    <div
      ref={element => {
        frame = element;
      }}
      class={styles.frame}
      data-picture={props.id}
      data-mode={props.mode ?? 'still'}
      data-playing={playing()}
      style={
        playing() === 'scroll' ? {'--whats-new-play-at': '0ms'} : undefined
      }
      aria-hidden="true"
    >
      <div class={styles.stage}>{props.children}</div>
    </div>
  );
}
