import {MDXComponents} from 'mdx/types';
import {JSX} from 'solid-js';
import * as styles from './components.css';

export const mdxComponents: MDXComponents = {
  h1: props => <h1 {...props} class={styles.h1} />,
  h2: props => <h2 {...props} class={styles.h2} />,
  h3: props => <h3 {...props} class={styles.h3} />,
  h4: props => <h4 {...props} class={styles.h4} />,
  h5: props => <h5 {...props} class={styles.h5} />,
  h6: props => <h6 {...props} class={styles.h6} />,
  p: props => <p {...props} class={styles.p} />,
  code: props => <code {...props} class={styles.code} />,
  img: (props: JSX.IntrinsicElements['img']) => (
    <img {...props} loading={'lazy'} decoding={'async'} class={styles.img} />
  ),
  a: (props: JSX.IntrinsicElements['a']) => (
    <a {...props} target={'_blank'} class={styles.a} />
  ),
  ul: (props: JSX.IntrinsicElements['ul']) => (
    <ul {...props} class={styles.ul} />
  ),
  li: (props: JSX.IntrinsicElements['li']) => (
    <li {...props} class={styles.li} />
  ),
  video: (props: JSX.IntrinsicElements['video']) => (
    <video
      {...props}
      autoplay={true}
      class={styles.video}
      ref={el => setTimeout(() => el.play())}
    />
  ),
};
