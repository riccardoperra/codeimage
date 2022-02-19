import {InlineTextField} from '../../ui/TextField/InlineTextField';

import * as styles from './WindowsTerminal.css';
import {JSXElement, Show} from 'solid-js';
import {WindowsTerminalControls} from './WindowsTerminalControls';

interface WindowsTerminalHeaderProps {
  showTab: boolean;
  accentVisible: boolean;
  darkMode: boolean;
}

export function WindowsTerminalHeader(
  props: WindowsTerminalHeaderProps,
): JSXElement {
  return (
    <div
      class={styles.header}
      data-theme-mode={props.darkMode ? 'dark' : 'light'}
      data-accent-visible={props.accentVisible}
    >
      <Show when={props.showTab}>
        <div class={styles.tab}>
          <InlineTextField
            size={'sm'}
            placeholder={'Untitled'}
            disabled={true}
          />
        </div>
      </Show>

      <WindowsTerminalControls />
    </div>
  );
}
