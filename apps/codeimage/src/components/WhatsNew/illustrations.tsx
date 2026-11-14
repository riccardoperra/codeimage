import type {Component} from 'solid-js';
import type {HighlightId} from '../../state/whats-new';
import * as styles from './whats-new.css';

function CommandIllustration() {
  return (
    <div class={styles.illustration} aria-hidden="true">
      <div class={styles.miniWindow}>
        <div>⌕ Search anything</div>
        <hr />
        <div>Theme: GitHub Dark</div>
        <div>Layout: Inspector</div>
        <div>Export image</div>
      </div>
      <kbd>⌘ K</kbd>
    </div>
  );
}

function RedactIllustration() {
  return (
    <div class={styles.illustration} aria-hidden="true">
      <div class={styles.miniWindow}>
        <div>const client = connect({'{'}</div>
        <div>
          &nbsp;&nbsp;token: '<span class={styles.redacted}>••••••••••</span>',
        </div>
        <div>{'}'});</div>
      </div>
    </div>
  );
}

function TabsIllustration() {
  return (
    <div class={styles.illustration} aria-hidden="true">
      <svg width="250" height="96" viewBox="0 0 250 96">
        <rect
          class={styles.wireCanvas}
          x="0"
          y="8"
          width="96"
          height="80"
          rx="8"
        />
        <rect fill="currentColor" x="8" y="16" width="24" height="8" rx="3" />
        <rect
          class={styles.wireFrame}
          x="36"
          y="16"
          width="24"
          height="8"
          rx="3"
        />
        <rect
          class={styles.wireFrame}
          x="64"
          y="16"
          width="24"
          height="8"
          rx="3"
        />
        <path
          d="M10 42h56m-56 12h40m-40 12h50"
          stroke="currentColor"
          stroke-width="3"
        />
        <path
          d="M112 48h24m-8-8 8 8-8 8"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect
          class={styles.wireCanvas}
          x="154"
          y="4"
          width="96"
          height="24"
          rx="6"
        />
        <rect
          class={styles.wireFrame}
          x="166"
          y="9"
          width="44"
          height="14"
          rx="3"
        />
        <rect
          class={styles.wireCanvas}
          x="154"
          y="36"
          width="96"
          height="24"
          rx="6"
        />
        <rect
          class={styles.wireFrame}
          x="166"
          y="41"
          width="44"
          height="14"
          rx="3"
        />
        <rect
          class={styles.wireCanvas}
          x="154"
          y="68"
          width="96"
          height="24"
          rx="6"
        />
        <rect
          class={styles.wireFrame}
          x="166"
          y="73"
          width="44"
          height="14"
          rx="3"
        />
      </svg>
    </div>
  );
}

function LayoutIllustration() {
  return (
    <div class={styles.illustration} aria-hidden="true">
      <svg width="250" height="90" viewBox="0 0 250 90">
        <rect
          class={styles.wireCanvas}
          x="0"
          y="10"
          width="72"
          height="65"
          rx="6"
        />
        <rect
          class={styles.wireFrame}
          x="12"
          y="26"
          width="32"
          height="30"
          rx="3"
        />
        <rect fill="currentColor" x="51" y="10" width="21" height="65" rx="5" />
        <rect
          class={styles.wireCanvas}
          x="89"
          y="10"
          width="72"
          height="65"
          rx="6"
        />
        <rect
          class={styles.wireFrame}
          x="109"
          y="22"
          width="32"
          height="30"
          rx="3"
        />
        <rect fill="currentColor" x="99" y="61" width="52" height="8" rx="4" />
        <rect
          class={styles.wireCanvas}
          x="178"
          y="10"
          width="72"
          height="65"
          rx="6"
        />
        <rect fill="currentColor" x="178" y="10" width="9" height="65" rx="4" />
        <rect
          class={styles.wireFrame}
          x="202"
          y="26"
          width="32"
          height="30"
          rx="3"
        />
      </svg>
    </div>
  );
}

function ThemeIllustration() {
  return (
    <div class={styles.illustration} aria-hidden="true">
      <svg width="240" height="100" viewBox="0 0 240 100">
        <rect
          class={styles.wireCanvas}
          x="5"
          y="16"
          width="72"
          height="68"
          rx="8"
        />
        <rect
          class={styles.wireFrame}
          x="16"
          y="27"
          width="50"
          height="46"
          rx="5"
        />
        <path
          d="M24 40h30m-30 8h18m-18 8h25"
          stroke="currentColor"
          stroke-width="3"
        />
        <circle cx="123" cy="50" r="25" fill="currentColor" opacity=".2" />
        <path
          d="M105 44h25m-25 8h35m-35 8h18"
          stroke="currentColor"
          stroke-width="4"
        />
        <text
          x="178"
          y="62"
          fill="currentColor"
          font-size="34"
          font-family="monospace"
        >
          Aa
        </text>
      </svg>
    </div>
  );
}

export const illustrations: Record<HighlightId, Component> = {
  redact: RedactIllustration,
  tabs: TabsIllustration,
  'command-menu': CommandIllustration,
  layouts: LayoutIllustration,
  'theme-cards': ThemeIllustration,
};
