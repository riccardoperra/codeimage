import {JSX, onCleanup, onMount} from 'solid-js';
import * as styles from './components.css';

export function MdxVideo(props: JSX.IntrinsicElements['video']) {
  let ref!: HTMLVideoElement;

  onMount(() => {
    ref.load();
    const observe = new IntersectionObserver(
      ([el]) => {
        if (el.isIntersecting) {
          ref.play();
          observe.unobserve(ref);
        }
      },
      {rootMargin: '-30% 0px -20% 0px'},
    );
    observe.observe(ref);
    onCleanup(() => observe.disconnect());
  });

  return (
    <video
      class={styles.video}
      ref={ref}
      controls={false}
      playsinline
      muted
      preload={'none'}
      loop
      {...props}
    />
  );
}
