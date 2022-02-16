import {For} from 'solid-js';
import {Terminal} from '../Terminal/Terminal';
import {Text} from '../ui/Text/Text';

import * as styles from './ThemeSwitcher.css';
import {ThemeBox} from './ThemeBox';
import {updateBackground} from '../../state/frame.state';
import {THEMES} from '../../core/theme';

export const ThemeSwitcher = () => {
  const themes = THEMES;

  return (
    <div class={styles.grid}>
      <For each={themes}>
        {theme => (
          <ThemeBox
            theme={theme}
            onClick={() => updateBackground(theme.properties.previewBackground)}
          >
            <Terminal>
              <Text size={'sm'}>{`console.log('Hello!');`}</Text>
            </Terminal>
          </ThemeBox>
        )}
      </For>
    </div>
  );
};
