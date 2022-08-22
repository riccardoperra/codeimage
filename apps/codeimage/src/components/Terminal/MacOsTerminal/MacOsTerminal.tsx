import {backgroundColorVar, Box} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {ParentComponent, Show} from 'solid-js';
import {TerminalWindowTabList} from '../Tabs/TerminalWindowTabList';
import * as baseStyles from '../terminal.css';
import {BaseTerminalProps, TerminalHost} from '../TerminalHost';
import * as styles from './MacOsTerminal.css';

export const exportExclude = _exportExclude;

export const MacOsTerminal: ParentComponent<BaseTerminalProps> = props => {
  const showTab = () => props.accentVisible && !props.alternativeTheme;

  return (
    <TerminalHost {...props} themeClass={styles.theme}>
      <Show when={props.showHeader}>
        <div class={baseStyles.header} data-accent-visible={showTab()}>
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
            <TerminalWindowTabList
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
