import type {FlowProps, Ref} from 'solid-js';
import styles from './FeatureCard.module.css';

interface FeatureCardProps {
  ref?: Ref<HTMLDivElement>;

  class?: string;
}

export function FeatureCard(props: FlowProps<FeatureCardProps>) {
  const classes = () =>
    props.class ? `${styles.card} ${props.class}` : styles.card;

  return (
    <div class={classes()} ref={props.ref}>
      {props.children}
    </div>
  );
}

export function FeatureContent(props: FlowProps & {ref?: Ref<HTMLDivElement>}) {
  return (
    <div class={styles.content} ref={props.ref}>
      {props.children}
    </div>
  );
}

export function FeatureImageContent(props: FlowProps<{bgColor?: string}>) {
  const customStyles = () =>
    props.bgColor ? {'--background-color': props.bgColor} : {};

  return (
    <div class={styles.imageSection} style={customStyles()}>
      <div class={styles.imageWrapper}>{props.children}</div>
    </div>
  );
}
