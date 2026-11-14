import type {FrameState} from '@codeimage/store/frame/model';
import {Show} from 'solid-js';
import * as styles from './Frame.css';

export function FrameSignature(props: {signature: FrameState['signature']}) {
  return (
    <Show when={props.signature}>
      {signature => (
        <div
          class={styles.signature}
          data-frame-signature={signature().position}
          style={{
            left: signature().position === 'bottom-left' ? '24px' : undefined,
            right: signature().position === 'bottom-right' ? '24px' : undefined,
            'font-size': '20px',
          }}
        >
          {signature().handle}
        </div>
      )}
    </Show>
  );
}
