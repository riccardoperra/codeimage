import {InlineTextField} from '../../ui/TextField/InlineTextField';
import * as baseStyles from '../terminal.css';
import {JSXElement, Show} from 'solid-js';
import {WindowsTerminalControls} from './WindowsTerminalControls';
import {Box} from '../../ui/Box/Box';

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
      class={baseStyles.header}
      data-theme-mode={props.darkMode ? 'dark' : 'light'}
      data-accent-visible={props.accentVisible}
    >
      <Show when={props.showTab}>
        <Box class={baseStyles.tab} marginLeft={'6'}>
          <InlineTextField
            size={'sm'}
            placeholder={'Untitled'}
            disabled={true}
          />
        </Box>
      </Show>

      <WindowsTerminalControls />
    </div>
  );
}
