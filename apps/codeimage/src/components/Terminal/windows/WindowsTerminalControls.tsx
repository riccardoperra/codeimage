import * as styles from './WindowsTerminal.css';

export const WindowsTerminalControls = () => (
  <div class={styles.headerIconRow}>
    <svg
      class={styles.headerIconRowItem}
      viewBox="0 0 12 12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1={0}
        x2={12}
        y1={6}
        y2={6}
        stroke="currentColor"
        stroke-width="2"
      />
    </svg>

    <svg
      class={styles.headerIconRowItem}
      viewBox="0 0 12 12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        fill={'transparent'}
        width={'100%'}
        height={'100%'}
        stroke="currentColor"
        stroke-width="4"
      />
    </svg>

    <svg
      class={styles.headerIconRowItem}
      viewBox="0 0 12 12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="1"
        y1="11"
        x2="11"
        y2="1"
        stroke="currentColor"
        stroke-width="2"
      />
      <line
        x1="1"
        y1="1"
        x2="11"
        y2="11"
        stroke="currentColor"
        stroke-width="2"
      />
    </svg>
  </div>
);
