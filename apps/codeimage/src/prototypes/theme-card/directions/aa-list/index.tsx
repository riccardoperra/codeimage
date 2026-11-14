import {icons} from '@codeui/kit';
import {For} from 'solid-js';
import type {
  VariantMeta,
  VariantProps,
} from '../../../editor-controls/contract';
import {ThemeSwatch} from '../../../editor-controls/ThemeSwatch';
import {ThemePickerScreen} from '../../ThemePickerScreen';
import * as screen from '../../screen.css';
import * as styles from './aa-list.css';

export const meta: VariantMeta = {
  name: 'Aa list',
  axis: 'Density: one text row per theme, grouped by dark and light',
};

export default function AaList(props: VariantProps) {
  return (
    <ThemePickerScreen {...props} width={320}>
      {browser => (
        <For each={browser.groups()}>
          {group => (
            <div class={styles.group} role="group" aria-label={group.label}>
              <span class={styles.groupLabel}>{group.label}</span>
              <For each={group.themes}>
                {theme => (
                  <button class={styles.row} {...browser.optionProps(theme)}>
                    <ThemeSwatch theme={theme} size={28} variant="aa" />
                    <span class={`${screen.name} ${styles.label}`}>
                      {theme.name}
                    </span>
                    <icons.CheckIcon class={styles.check} />
                  </button>
                )}
              </For>
            </div>
          )}
        </For>
      )}
    </ThemePickerScreen>
  );
}
