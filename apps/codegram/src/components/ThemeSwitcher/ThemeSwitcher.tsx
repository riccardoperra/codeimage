import {For} from 'solid-js';
import {Terminal} from '../Terminal/Terminal';
import {Text} from '../ui/Text/Text';

import * as styles from './ThemeSwitcher.css';
import {ThemeBox} from './ThemeBox';
import {THEMES} from './fake-theme';
import {updateBackground} from '../../state/frame.state';

export const ThemeSwitcher = () => {
  const fakeThemes = THEMES;

  return (
    <div class={styles.grid}>
      <For each={fakeThemes}>
        {theme => (
          <ThemeBox bg={theme.bg} onClick={() => updateBackground(theme.bg)}>
            <Terminal>
              <Text size={'sm'}>{`console.log('Hello!');`}</Text>
            </Terminal>
          </ThemeBox>
        )}
      </For>
    </div>
  );
};
