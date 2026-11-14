import {For} from 'solid-js';
import type {
  VariantMeta,
  VariantProps,
} from '../../../editor-controls/contract';
import {ModeIcon} from '../../ModeIcon';
import {ThemePickerScreen} from '../../ThemePickerScreen';
import * as screen from '../../screen.css';
import * as styles from './code.css';

export const meta: VariantMeta = {
  name: 'Code',
  axis: 'Fidelity: real highlighted code, large enough to read',
};

export default function Code(props: VariantProps) {
  return (
    <ThemePickerScreen {...props} width={360}>
      {browser => (
        <div class={styles.list}>
          <For each={browser.themes()}>
            {theme => (
              <button class={styles.item} {...browser.optionProps(theme)}>
                <span
                  class={`${screen.mark} ${styles.preview}`}
                  style={{background: theme.colors.background}}
                >
                  <props.stage.ThemePreview theme={theme} />
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
