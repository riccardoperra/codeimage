import {Box} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import type {ParentComponent} from 'solid-js';
import {Show} from 'solid-js';
import {TerminalWindowTabList} from '../Tabs/TerminalWindowTabList';
import * as baseStyles from '../terminal.css';
import type {BaseTerminalProps} from '../TerminalHost';
import {TerminalHost} from '../TerminalHost';
import * as styles from './WindowsTerminal.css';
import {WindowsTerminalControls} from './WindowsTerminalControls';
import {useWatermarkPart} from '../../../core/watermark/scope';

export const exportExclude = _exportExclude;

export const WindowsTerminal: ParentComponent<BaseTerminalProps> = props => {
  const showTab = () => props.accentVisible && !props.alternativeTheme;
  const headerRef = useWatermarkPart('header');
  const contentRef = useWatermarkPart('content');
  return (
    <TerminalHost {...props} themeClass={styles.theme}>
      <Show when={props.showHeader}>
        <div
          class={baseStyles.header}
          ref={headerRef}
          data-watermark-header
          data-accent-visible={showTab()}
        >
          <Show when={props.showTab && (!props.lite || props.preview)}>
            <TerminalWindowTabList
              activeTabId={props.activeTabId}
              lite={props.lite}
              preview={props.preview ?? false}
              readOnly={props.readonlyTab}
              accent={props.accentVisible && !props.alternativeTheme}
            />
          </Show>

          <WindowsTerminalControls />
        </div>
      </Show>

      <Show when={props.children}>
        <div class={baseStyles.content} ref={contentRef} data-watermark-content>
          <Box position={'relative'}>
            <div>{props.children}</div>
          </Box>
        </div>
      </Show>
    </TerminalHost>
  );
};
