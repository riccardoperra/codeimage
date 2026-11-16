import {backgroundColorVar, Box} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {ParentComponent} from 'solid-js';
import {Show} from 'solid-js';
import {TerminalWindowTabList} from '../Tabs/TerminalWindowTabList';
import * as baseStyles from '../terminal.css';
import type {BaseTerminalProps} from '../TerminalHost';
import {TerminalHost} from '../TerminalHost';
import * as styles from './MacOsTerminal.css';
import {useWatermarkPart} from '../../../core/watermark/scope';

export const exportExclude = _exportExclude;

export interface MacOsTerminalProps extends BaseTerminalProps {
  headerType?: 'default' | 'outline' | 'gray';
}

export const MacOsTerminal: ParentComponent<MacOsTerminalProps> = props => {
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
          data-lite={props.lite}
          data-accent-visible={showTab()}
        >
          <div
            class={styles.headerIconRow}
            data-watermark-obstacle
            data-lite={props.lite}
            data-header-type={props.headerType ?? 'default'}
          >
            <div
              class={styles.headerIconRowCircle}
              style={assignInlineVars({
                [backgroundColorVar]: styles.vars.controls.red,
              })}
            />
            <div
              class={styles.headerIconRowCircle}
              style={assignInlineVars({
                [backgroundColorVar]: styles.vars.controls.yellow,
              })}
            />
            <div
              class={styles.headerIconRowCircle}
              style={assignInlineVars({
                [backgroundColorVar]: styles.vars.controls.green,
              })}
            />
          </div>

          <Show when={!props.showTab && props.title}>
            <span class={baseStyles.title} data-animation-title>
              {props.title}
            </span>
          </Show>
          <Show when={props.showTab && (!props.lite || props.preview)}>
            <TerminalWindowTabList
              fixedTabs={props.fixedTabs}
              activeTabId={props.activeTabId}
              lite={props.lite}
              showOnlyActiveTab={props.showOnlyActiveTab}
              preview={props.preview ?? false}
              readOnly={props.readonlyTab}
              accent={props.accentVisible && !props.alternativeTheme}
            />
          </Show>
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
