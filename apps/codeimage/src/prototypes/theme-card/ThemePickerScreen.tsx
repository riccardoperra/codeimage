import {assignInlineVars} from '@vanilla-extract/dynamic';
import {Toolbar} from '../../components/Toolbar/Toolbar';
import type {VariantProps} from '../editor-controls/contract';
import {ThemePicker} from '../editor-controls/theme-styles/ThemePicker';
import type {ThemeStyleId} from '../editor-controls/theme-styles/style';
import * as styles from './screen.css';

interface ThemePickerScreenProps extends VariantProps {
  readonly style: ThemeStyleId;
  /** Width of the theme island in px. */
  readonly width: number;
}

/** The real header, the live canvas, and one theme picker in an island beside it. */
export function ThemePickerScreen(props: ThemePickerScreenProps) {
  return (
    <div class={styles.screen}>
      <Toolbar canvasRef={props.stage.exportRef()} />
      <div class={styles.body}>
        <main class={styles.canvasIsland}>
          <props.stage.Canvas />
        </main>
        <aside
          class={styles.themeIsland}
          style={assignInlineVars({[styles.islandWidth]: `${props.width}px`})}
          aria-label="Themes"
        >
          <span class={styles.islandTitle}>Theme</span>
          <div class={styles.picker}>
            <ThemePicker
              model={props.model}
              stage={props.stage}
              style={props.style}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
