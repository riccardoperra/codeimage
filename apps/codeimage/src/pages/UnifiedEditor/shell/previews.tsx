import type {JSX} from 'solid-js';
import {Match, Switch} from 'solid-js';
import type {InspectorSide, LayoutId} from './preferences';
import * as styles from './settings.css';

function Wire(props: {children: JSX.Element}) {
  return (
    <svg
      class={styles.wire}
      width="104"
      height="60"
      viewBox="0 0 104 60"
      aria-hidden="true"
    >
      {props.children}
    </svg>
  );
}

/** A wireframe of one layout: where the controls sit around the canvas. */
export function LayoutPreview(props: {layout: LayoutId; side: InspectorSide}) {
  return (
    <Switch>
      <Match when={props.layout === 'inspector'}>
        <Wire>
          <g
            transform={
              props.side === 'left' ? 'translate(104) scale(-1 1)' : ''
            }
          >
            <rect
              class={styles.wireCanvas}
              x="2"
              y="4"
              width="68"
              height="52"
              rx="5"
            />
            <rect
              class={styles.wireFrame}
              x="20"
              y="18"
              width="32"
              height="24"
              rx="3"
            />
            <rect
              class={styles.wireControl}
              x="74"
              y="4"
              width="28"
              height="52"
              rx="5"
            />
          </g>
        </Wire>
      </Match>
      <Match when={props.layout === 'dock'}>
        <Wire>
          <rect
            class={styles.wireCanvas}
            x="2"
            y="4"
            width="100"
            height="52"
            rx="5"
          />
          <rect
            class={styles.wireFrame}
            x="36"
            y="12"
            width="32"
            height="24"
            rx="3"
          />
          <rect
            class={styles.wireControl}
            x="22"
            y="43"
            width="60"
            height="9"
            rx="4.5"
          />
        </Wire>
      </Match>
      <Match when={props.layout === 'studio'}>
        <Wire>
          <rect
            class={styles.wireControl}
            x="2"
            y="4"
            width="9"
            height="52"
            rx="4.5"
          />
          <rect
            class={styles.wireControlSoft}
            x="15"
            y="4"
            width="26"
            height="52"
            rx="5"
          />
          <rect
            class={styles.wireCanvas}
            x="45"
            y="4"
            width="57"
            height="52"
            rx="5"
          />
          <rect
            class={styles.wireFrame}
            x="58"
            y="18"
            width="32"
            height="24"
            rx="3"
          />
        </Wire>
      </Match>
    </Switch>
  );
}
