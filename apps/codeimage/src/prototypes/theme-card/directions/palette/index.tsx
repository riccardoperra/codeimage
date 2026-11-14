import {For} from 'solid-js';
import type {
  VariantMeta,
  VariantProps,
} from '../../../editor-controls/contract';
import {ThemeSwatch} from '../../../editor-controls/ThemeSwatch';
import {ModeIcon} from '../../ModeIcon';
import {ThemePickerScreen} from '../../ThemePickerScreen';
import * as screen from '../../screen.css';
import * as styles from './palette.css';

export const meta: VariantMeta = {
  name: 'Palette',
  axis: 'Information: the syntax colours themselves, nothing else',
};

export default function Palette(props: VariantProps) {
  return (
    <ThemePickerScreen {...props} width={340}>
      {browser => (
        <div class={styles.grid}>
          <For each={browser.themes()}>
            {theme => (
              <button class={styles.item} {...browser.optionProps(theme)}>
                <span class={`${screen.mark} ${styles.swatch}`}>
                  <ThemeSwatch
                    theme={theme}
                    size={44}
                    width={126}
                    variant="palette"
                  />
                  <span class={screen.markRing} />
                </span>
                <span class={styles.footer}>
                  <span class={screen.name}>{theme.name}</span>
                  <ModeIcon dark={theme.dark} />
                </span>
              </button>
            )}
          </For>
        </div>
      )}
    </ThemePickerScreen>
  );
}
