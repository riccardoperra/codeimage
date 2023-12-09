import {JSX} from 'solid-js';
import * as styles from './components.css';

export function MdxVideo(props: JSX.IntrinsicElements['video']) {
  return (
    <video
      class={styles.video}
      autoplay
      controls={false}
      playsinline
      muted
      preload={'none'}
      loop
      {...props}
    />
  );
}
