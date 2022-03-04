import {Component, For} from 'solid-js';
import {Text} from '../ui/Text/Text';
import * as styles from './ThemeSwitcher.css';
import {gridSize, ThemeSwitcherVariant} from './ThemeSwitcher.css';
import {ThemeBox} from './ThemeBox';
import {useTerminalState} from '../../state/terminal';
import {updateTheme} from '../../state/state';
import {DynamicTerminal} from '../Terminal/dynamic/DynamicTerminal';
import {useStaticConfiguration} from '../../core/configuration';
import {assignInlineVars} from '@vanilla-extract/dynamic';

export const ThemeSwitcher: Component<ThemeSwitcherVariant> = props => {
  const {themes} = useStaticConfiguration();
  const terminal = useTerminalState();

  return (
    <div
      class={styles.grid({
        orientation: props.orientation,
      })}
      style={assignInlineVars({
        [gridSize]: themes.length.toString(),
      })}
    >
      <For each={themes}>
        {theme => (
          <ThemeBox theme={theme} onClick={() => updateTheme(theme)}>
            <DynamicTerminal
              tabName={'Untitled'}
              textColor={theme.properties.terminal.text}
              background={theme.properties.terminal.main}
              darkMode={theme.properties.darkMode}
              accentVisible={terminal.accentVisible}
              shadow={terminal.shadow}
              showTab={true}
              showHeader={true}
              type={terminal.type}
            >
              <Text size={'sm'}>{`console.log('Hello!');`}</Text>
            </DynamicTerminal>
          </ThemeBox>
        )}
      </For>
    </div>
  );
};
