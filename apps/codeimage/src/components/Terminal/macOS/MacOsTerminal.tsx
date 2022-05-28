import {backgroundColorVar, Box, Text} from '@codeimage/ui';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {ParentComponent, Show} from 'solid-js';
import {exportExclude as _exportExclude} from '../../../core/directives/exportExclude';
import {TabIcon} from '../tabs/TabIcon';
import {TabName} from '../tabs/TabName';
import {WindowTab} from '../tabs/WindowTab';
import {WindowTabListManager} from '../tabs/WindowTabListManager';
import * as baseStyles from '../terminal.css';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import * as styles from './MacOsTerminal.css';

export const exportExclude = _exportExclude;

export const MacOsTerminal: ParentComponent<BaseTerminalProps> = props => {
  const showTab = () => props.accentVisible && !props.alternativeTheme;
  return (
    <TerminalHost {...props} theme={styles.theme}>
      <Show when={props.showHeader}>
        <div
          class={baseStyles.header}
          data-theme-mode={props.darkMode ? 'dark' : 'light'}
          data-accent-visible={showTab()}
        >
          <div class={styles.headerIconRow}>
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

          <Show when={props.showTab}>
            <WindowTabListManager />
            {/*<WindowTab*/}
            {/*  tabName={props.tabName ?? 'Untitled'}*/}
            {/*  tabIcon={props.tabIcon}*/}
            {/*  readonlyTab={props.readonlyTab}*/}
            {/*  accentMode={showTab()}*/}
            {/*  onTabChange={value => props.onTabChange?.(value)}*/}
            {/*/>*/}
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
