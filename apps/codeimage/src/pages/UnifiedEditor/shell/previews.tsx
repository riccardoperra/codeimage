import type {JSX} from 'solid-js';
import {createUniqueId, Match, Switch} from 'solid-js';
import type {ColourModeId, LayoutId, PanelNav, PanelSide} from './preferences';
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

/** The sidebar drawn on the right; the left side is its mirror image. */
function Mirror(props: {side: PanelSide; children: JSX.Element}) {
  return (
    <g transform={props.side === 'left' ? 'translate(104) scale(-1 1)' : ''}>
      {props.children}
    </g>
  );
}

/** A wireframe of the sidebar's navigation: an accordion, or a rail with its panel. */
export function NavPreview(props: {nav: PanelNav; side: PanelSide}) {
  return (
    <Wire>
      <Mirror side={props.side}>
        <Switch>
          <Match when={props.nav === 'accordion'}>
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
              class={styles.wireControlSoft}
              x="74"
              y="4"
              width="28"
              height="52"
              rx="5"
            />
            <rect
              class={styles.wireControl}
              x="77"
              y="8"
              width="22"
              height="4"
              rx="2"
            />
            <rect
              class={styles.wireCanvas}
              x="77"
              y="15"
              width="22"
              height="22"
              rx="2"
            />
            <rect
              class={styles.wireControl}
              x="77"
              y="41"
              width="22"
              height="3"
              rx="1.5"
            />
            <rect
              class={styles.wireControl}
              x="77"
              y="46"
              width="22"
              height="3"
              rx="1.5"
            />
            <rect
              class={styles.wireControl}
              x="77"
              y="51"
              width="22"
              height="2"
              rx="1"
            />
          </Match>
          <Match when={props.nav === 'rail'}>
            <rect
              class={styles.wireCanvas}
              x="2"
              y="4"
              width="57"
              height="52"
              rx="5"
            />
            <rect
              class={styles.wireFrame}
              x="14"
              y="18"
              width="32"
              height="24"
              rx="3"
            />
            <rect
              class={styles.wireControlSoft}
              x="63"
              y="4"
              width="26"
              height="52"
              rx="5"
            />
            <rect
              class={styles.wireControl}
              x="93"
              y="4"
              width="9"
              height="52"
              rx="4.5"
            />
          </Match>
        </Switch>
      </Mirror>
    </Wire>
  );
}

/** A wireframe of one layout: where the controls sit around the canvas. */
export function LayoutPreview(props: {
  layout: LayoutId;
  nav: PanelNav;
  side: PanelSide;
}) {
  return (
    <Switch>
      <Match when={props.layout === 'sidebar'}>
        <NavPreview nav={props.nav} side={props.side} />
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
    </Switch>
  );
}

/**
 * One colour mode as an orb: a night sphere with a few stars, a day sphere
 * with a soft halo, and for System a sphere lit on one side and dark on the
 * other. The colours stand for the modes, so they do not follow the theme.
 */
export function ColourModeOrb(props: {mode: ColourModeId}) {
  const id = createUniqueId();
  const url = (name: string) => `url(#${id}-${name})`;
  return (
    <svg
      class={styles.orb}
      width="104"
      height="60"
      viewBox="0 0 104 60"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${id}-night`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stop-color="#5b5f86" />
          <stop offset="0.55" stop-color="#262a45" />
          <stop offset="1" stop-color="#0d0f1c" />
        </radialGradient>
        <radialGradient id={`${id}-day`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.5" stop-color="#fff2cf" />
          <stop offset="1" stop-color="#f2b456" />
        </radialGradient>
        <radialGradient id={`${id}-halo`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.45" stop-color="#ffc861" stop-opacity="0.7" />
          <stop offset="1" stop-color="#ffd27a" stop-opacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-shine`} cx="0.32" cy="0.26" r="0.45">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.55" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <clipPath id={`${id}-half`}>
          <path d="M30 0 L74 60 L104 60 L104 0 Z" />
        </clipPath>
      </defs>
      <Switch>
        <Match when={props.mode === 'dark'}>
          <circle cx="52" cy="30" r="21" fill={url('night')} />
          <circle class={styles.orbRim} cx="52" cy="30" r="20.5" fill="none" />
          <circle cx="52" cy="30" r="21" fill={url('shine')} opacity="0.4" />
          <g class={styles.orbStars}>
            <circle cx="21" cy="14" r="1.2" />
            <circle cx="84" cy="11" r="1" />
            <circle cx="88" cy="44" r="1.4" />
            <circle cx="16" cy="45" r="0.9" />
            <circle cx="77" cy="26" r="0.7" />
          </g>
        </Match>
        <Match when={props.mode === 'light'}>
          <circle cx="52" cy="30" r="29" fill={url('halo')} />
          <circle cx="52" cy="30" r="21" fill={url('day')} />
          <circle cx="52" cy="30" r="21" fill={url('shine')} />
          <circle class={styles.orbRim} cx="52" cy="30" r="20.5" fill="none" />
        </Match>
        <Match when={props.mode === 'system'}>
          <circle cx="52" cy="30" r="21" fill={url('day')} />
          <circle
            cx="52"
            cy="30"
            r="21"
            fill={url('night')}
            clip-path={url('half')}
          />
          <line
            class={styles.orbSeam}
            x1="38.4"
            y1="10.3"
            x2="65.6"
            y2="49.7"
          />
          <circle cx="52" cy="30" r="21" fill={url('shine')} opacity="0.6" />
        </Match>
      </Switch>
    </svg>
  );
}
