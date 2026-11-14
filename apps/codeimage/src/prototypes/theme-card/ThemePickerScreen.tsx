import {TextField} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {JSX} from 'solid-js';
import {onCleanup, Show} from 'solid-js';
import {Toolbar} from '../../components/Toolbar/Toolbar';
import type {VariantProps} from '../editor-controls/contract';
import type {ThemeBrowser, ThemeMode} from './browser';
import {createThemeBrowser} from './browser';
import * as styles from './screen.css';

interface ThemePickerScreenProps extends VariantProps {
  /** Width of the theme island in px. */
  width: number;
  children: (browser: ThemeBrowser) => JSX.Element;
}

const modes: {label: string; value: ThemeMode}[] = [
  {label: 'All', value: 'all'},
  {label: 'Dark', value: 'dark'},
  {label: 'Light', value: 'light'},
];

/** The real header, the live canvas, and one theme picker in an island beside it. */
export function ThemePickerScreen(props: ThemePickerScreenProps) {
  // oxlint-disable-next-line solid/reactivity -- one model lives for the whole session
  const browser = createThemeBrowser(props.model);
  onCleanup(() => props.model.endThemePreview());

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
          <div class={styles.islandHeader}>
            <span class={styles.islandTitle}>Theme</span>
            <span class={styles.muted}>
              {browser.themes().length} of {props.model.themes().length}
            </span>
          </div>
          <div
            onKeyDown={event => {
              if (event.key !== 'ArrowDown') return;
              event.preventDefault();
              browser.focusFirst();
            }}
          >
            <TextField
              placeholder="Search theme…"
              value={browser.query()}
              onChange={browser.setQuery}
              aria-label="Search theme"
            />
          </div>
          <div class={styles.filter}>
            <SegmentedField
              size="sm"
              adapt
              value={browser.mode()}
              onChange={browser.setMode}
              items={modes}
            />
          </div>
          <div class={styles.list} {...browser.listProps}>
            <Show
              when={browser.themes().length > 0}
              fallback={<p class={styles.empty}>No theme matches.</p>}
            >
              {props.children(browser)}
            </Show>
          </div>
        </aside>
      </div>
    </div>
  );
}
