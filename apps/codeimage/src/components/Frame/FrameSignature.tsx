import type {FrameState} from '@codeimage/store/frame/model';
import {Show} from 'solid-js';
import * as styles from './Frame.css';

// The signature sits 16px from the bottom and is 34px tall; keep 16px clear above it.
const SIGNATURE_SPACE = 66;

export const frameBottomPadding = (
  padding: number,
  signature: FrameState['signature'],
) => (signature ? Math.max(padding, SIGNATURE_SPACE) : padding);

export function framePadding(
  padding: number,
  signature: FrameState['signature'],
) {
  return signature
    ? `${padding}px ${padding}px ${frameBottomPadding(padding, signature)}px`
    : `${padding}px`;
}

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
