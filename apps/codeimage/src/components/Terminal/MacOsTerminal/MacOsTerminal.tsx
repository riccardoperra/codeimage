import {backgroundColorVar, Box} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {ParentComponent, Show} from 'solid-js';
import {TerminalWindowTabList} from '../Tabs/TerminalWindowTabList';
import * as baseStyles from '../terminal.css';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import * as styles from './MacOsTerminal.css';

export const exportExclude = _exportExclude;

export interface MacOsTerminalProps extends BaseTerminalProps {
  headerType: 'default' | 'outline' | 'gray';
}

export const MacOsTerminal: ParentComponent<MacOsTerminalProps> = props => {
  const showTab = () => props.accentVisible && !props.alternativeTheme;

  return (
    <TerminalHost {...props} themeClass={styles.theme}>
      <Show when={props.showHeader}>
        <div
          class={baseStyles.header}
          data-lite={props.lite}
          data-accent-visible={showTab()}
        >
          <div
            class={styles.headerIconRow}
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

          <Show when={props.showTab && (!props.lite || props.preview)}>
            <TerminalWindowTabList
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
        <div class={baseStyles.content}>
          <Box position={'relative'}>
            <div>{props.children}</div>
          </Box>
        </div>
      </Show>
    </TerminalHost>
  );
};
