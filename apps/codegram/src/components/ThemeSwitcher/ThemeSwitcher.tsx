import {For} from 'solid-js';
import {Terminal} from '../Terminal/Terminal';
import {Text} from '../ui/Text/Text';

import * as styles from './ThemeSwitcher.css';
import {ThemeBox} from './ThemeBox';
import {THEMES} from '../../core/theme';
import {useTerminalState} from '../../state/terminal';
import {updateTheme} from '../../state/state';

export const ThemeSwitcher = () => {
  const themes = THEMES;
  const terminal = useTerminalState();

  return (
    <div class={styles.grid}>
      <For each={themes}>
        {theme => (
          <ThemeBox theme={theme} onClick={() => updateTheme(theme)}>
            <Terminal
              textColor={theme.properties.terminal.text}
              background={theme.properties.terminal.main}
              darkMode={theme.properties.darkMode}
              accentVisible={terminal.accentVisible}
              shadow={terminal.shadow}
            >
              <Text size={'sm'}>{`console.log('Hello!');`}</Text>
            </Terminal>
          </ThemeBox>
        )}
      </For>
    </div>
  );
};
