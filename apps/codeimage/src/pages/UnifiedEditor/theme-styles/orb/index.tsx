import {For} from 'solid-js';
import {ThemeSwatch} from '../../ThemeSwatch';
import type {ThemeListProps} from '../ThemePicker';
import {ModeIcon} from '../ModeIcon';
import * as picker from '../picker.css';
import * as styles from './orb.css';

export function OrbList(props: ThemeListProps) {
  return (
    <div class={styles.grid}>
      <For each={props.browser.themes()}>
        {theme => (
          <button class={styles.item} {...props.browser.optionProps(theme)}>
            <span class={picker.mark}>
              <ThemeSwatch theme={theme} size={48} variant="syntax-orb" />
              <span class={styles.badge}>
                <ModeIcon dark={theme.dark} size={12} />
              </span>
              <span class={picker.markRing} />
            </span>
            <span class={picker.name}>{theme.name}</span>
          </button>
        )}
      </For>
    </div>
  );
}
