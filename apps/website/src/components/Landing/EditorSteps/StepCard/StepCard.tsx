import type {JSXElement, VoidProps} from 'solid-js';
import styles from './StepCard.module.css';

interface StepCard {
  active: boolean;
  title: JSXElement | string;
  description: JSXElement | string;
  activeColor: string;
}

export function StepCard(props: VoidProps<StepCard>) {
  return (
    <div
      data-active={props.active}
      class={styles.container}
      style={{'--active-color': props.activeColor}}
    >
      <div>
        <h3 style={{margin: 0, 'font-size': '1.5rem', 'font-weight': 700}}>
          {props.title}
        </h3>

        <div style={{'margin-top': '1.5rem'}}>
          <p style={{margin: 0, 'font-size': '1.125rem', 'line-height': 1.5}}>
            {props.description}
          </p>
        </div>
      </div>
    </div>
  );
}
