import {For, from} from 'solid-js';
import {Terminal} from '../Terminal/Terminal';
import {Text} from '../ui/Text/Text';

import * as styles from './ThemeSwitcher.css';
import {ThemeBox} from './ThemeBox';
import {frameState, updateTheme} from '../../state/frame.state';
import {THEMES} from '../../core/theme';

export const ThemeSwitcher = () => {
  const themes = THEMES;
  const state = from(frameState);

  return (
    <div class={styles.grid}>
      <For each={themes}>
        {theme => (
          <ThemeBox theme={theme} onClick={() => updateTheme(theme)}>
            <Terminal
              terminalTextColor={theme.properties.terminal.text}
              terminalBackground={theme.properties.terminal.main}
              darkMode={theme.properties.darkMode}
              accentVisible={state().accentVisible}
              shadow={state().shadow}
            >
              <Text size={'sm'}>{`console.log('Hello!');`}</Text>
            </Terminal>
          </ThemeBox>
        )}
      </For>
    </div>
  );
};
