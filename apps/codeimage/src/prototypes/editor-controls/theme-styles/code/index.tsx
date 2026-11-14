import {For} from 'solid-js';
import type {ThemeListProps} from '../ThemePicker';
import {ModeIcon} from '../ModeIcon';
import * as picker from '../picker.css';
import * as styles from './code.css';

export function CodeList(props: ThemeListProps) {
  return (
    <div class={styles.list}>
      <For each={props.browser.themes()}>
        {theme => (
          <button class={styles.item} {...props.browser.optionProps(theme)}>
            <span
              class={`${picker.mark} ${styles.preview}`}
              style={{background: theme.colors.background}}
            >
              <props.stage.ThemePreview theme={theme} />
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
