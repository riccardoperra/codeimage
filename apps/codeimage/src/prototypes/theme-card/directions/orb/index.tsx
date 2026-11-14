import {For} from 'solid-js';
import type {
  VariantMeta,
  VariantProps,
} from '../../../editor-controls/contract';
import {ThemeSwatch} from '../../../editor-controls/ThemeSwatch';
import {ModeIcon} from '../../ModeIcon';
import {ThemePickerScreen} from '../../ThemePickerScreen';
import * as screen from '../../screen.css';
import * as styles from './orb.css';

export const meta: VariantMeta = {
  name: 'Orb',
  axis: 'Identity: one soft mark per theme on roomy cards',
};

export default function Orb(props: VariantProps) {
  return (
    <ThemePickerScreen {...props} width={360}>
      {browser => (
        <div class={styles.grid}>
          <For each={browser.themes()}>
            {theme => (
              <button class={styles.item} {...browser.optionProps(theme)}>
                <span class={screen.mark}>
                  <ThemeSwatch theme={theme} size={48} variant="syntax-orb" />
                  <span class={styles.badge}>
                    <ModeIcon dark={theme.dark} size={12} />
                  </span>
                  <span class={screen.markRing} />
                </span>
                <span class={screen.name}>{theme.name}</span>
              </button>
            )}
          </For>
        </div>
      )}
    </ThemePickerScreen>
  );
}
