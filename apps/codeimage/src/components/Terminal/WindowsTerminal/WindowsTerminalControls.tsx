import * as styles from './WindowsTerminal.css';
import {SvgIcon} from '@codeimage/ui';

export const WindowsTerminalControls = () => (
  <div class={styles.headerIconRow} data-watermark-obstacle>
    <SvgIcon class={styles.headerIconRowItem} viewBox="0 0 12 12">
      <path fill="currentColor" d="M0 5h12v2H0z" />
    </SvgIcon>

    <SvgIcon class={styles.headerIconRowItem} viewBox="0 0 12 12">
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="M-2-2h16v16H-2z M2 2v8h8V2z"
      />
    </SvgIcon>

    <svg
      class={styles.headerIconRowItem}
      viewBox="0 0 12 12"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M0.292893 10.292893 10.292893 0.292893 11.707107 1.707107 1.707107 11.707107z"
      />
      <path
        fill="currentColor"
        d="M1.707107 0.292893 11.707107 10.292893 10.292893 11.707107 0.292893 1.707107z"
      />
    </svg>
  </div>
);
