import {For} from 'solid-js';
import {Text} from '../ui/Text/Text';
import * as styles from './ThemeSwitcher.css';
import {ThemeBox} from './ThemeBox';
import {useTerminalState} from '../../state/terminal';
import {updateTheme} from '../../state/state';
import {DynamicTerminal} from '../Terminal/dynamic/DynamicTerminal';
import {useStaticConfiguration} from '../../core/configuration';

export const ThemeSwitcher = () => {
  const {themes} = useStaticConfiguration();
  const terminal = useTerminalState();

  return (
    <div class={styles.grid}>
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
