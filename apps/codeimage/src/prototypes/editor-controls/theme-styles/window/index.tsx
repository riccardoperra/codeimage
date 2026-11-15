import {For} from 'solid-js';
import {ThemeSwatch} from '../../ThemeSwatch';
import type {ThemeListProps} from '../ThemePicker';
import {ModeIcon} from '../ModeIcon';
import * as picker from '../picker.css';
import * as styles from './window.css';

export function WindowList(props: ThemeListProps) {
  return (
    <div class={styles.grid}>
      <For each={props.browser.themes()}>
        {theme => (
          <button class={styles.item} {...props.browser.optionProps(theme)}>
            <span class={`${picker.mark} ${styles.swatch}`}>
              <ThemeSwatch
                theme={theme}
                size={56}
                width="fill"
                variant="window"
              />
              <span class={picker.markRing} />
            </span>
            <span class={styles.footer}>
              <span class={picker.name}>{theme.name}</span>
              <ModeIcon dark={theme.dark} />
            </span>
          </button>
        )}
      </For>
    </div>
  );
}
