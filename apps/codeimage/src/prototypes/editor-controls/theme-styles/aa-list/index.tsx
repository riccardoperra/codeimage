import {icons} from '@codeui/kit';
import {For} from 'solid-js';
import {ThemeSwatch} from '../../ThemeSwatch';
import type {ThemeListProps} from '../ThemePicker';
import * as picker from '../picker.css';
import * as styles from './aa-list.css';

export function AaList(props: ThemeListProps) {
  return (
    <For each={props.browser.groups()}>
      {group => (
        <div class={styles.group} role="group" aria-label={group.label}>
          <span class={styles.groupLabel}>{group.label}</span>
          <For each={group.themes}>
            {theme => (
              <button class={styles.row} {...props.browser.optionProps(theme)}>
                <ThemeSwatch theme={theme} size={28} variant="aa" />
                <span class={`${picker.name} ${styles.label}`}>
                  {theme.name}
                </span>
                <icons.CheckIcon class={styles.check} />
              </button>
            )}
          </For>
        </div>
      )}
    </For>
  );
}
