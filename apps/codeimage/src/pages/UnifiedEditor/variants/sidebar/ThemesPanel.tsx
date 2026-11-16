import type {PanelProps} from './panels';
import * as styles from './panels.css';

/** The theme picker in the style chosen in the harness, filling the panel. */
export function ThemesPanel(props: PanelProps) {
  return (
    <div class={styles.themeBody}>
      <props.ThemePicker size={props.size()} />
    </div>
  );
}
