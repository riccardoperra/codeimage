import {For} from 'solid-js';
import type {
  VariantMeta,
  VariantProps,
} from '../../../editor-controls/contract';
import {ThemeSwatch} from '../../../editor-controls/ThemeSwatch';
import {ModeIcon} from '../../ModeIcon';
import {ThemePickerScreen} from '../../ThemePickerScreen';
import * as screen from '../../screen.css';
import * as styles from './window.css';

export const meta: VariantMeta = {
  name: 'Window',
  axis: 'Miniature: the frame and window you export, with bars for code',
};

export default function Window(props: VariantProps) {
  return (
    <ThemePickerScreen {...props} width={360}>
      {browser => (
        <div class={styles.grid}>
          <For each={browser.themes()}>
            {theme => (
              <button class={styles.item} {...browser.optionProps(theme)}>
                <span class={`${screen.mark} ${styles.swatch}`}>
                  <ThemeSwatch
                    theme={theme}
                    size={52}
                    width={144}
                    variant="window"
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
