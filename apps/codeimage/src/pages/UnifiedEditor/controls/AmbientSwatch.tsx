import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {BackgroundControl} from '../model';
import * as styles from './controls.css';

export function AmbientSwatch(props: {control: BackgroundControl}) {
  return (
    <button
      type="button"
      class={styles.ambientSwatch}
      aria-pressed={
        props.control.value() === props.control.ambient().value
          ? 'true'
          : 'false'
      }
      onMouseEnter={() => props.control.preview(props.control.ambient().value)}
      onMouseLeave={() => props.control.endPreview()}
      onFocus={() => props.control.preview(props.control.ambient().value)}
      onBlur={() => props.control.endPreview()}
      onClick={() => props.control.set(props.control.ambient().value)}
    >
      <span
        class={styles.ambientSample}
        style={assignInlineVars({
          [styles.ambientBackground]: props.control.ambient().value,
        })}
      />
      <span>{props.control.ambient().label}</span>
    </button>
  );
}
