import {Button, TextField} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {Component} from 'solid-js';
import {onCleanup, onMount, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import type {EditorControlsModel, ThemeEntry} from '../model';
import type {Stage} from '../stage';
import {AaList} from './aa-list';
import type {ThemeBrowser, ThemeMode} from './browser';
import {createThemeBrowser} from './browser';
import {CodeList} from './code';
import {OrbList} from './orb';
import {PaletteList} from './palette';
import * as styles from './picker.css';
import type {ThemeStyleId} from './style';
import {WindowList} from './window';

export interface ThemeListProps {
  readonly browser: ThemeBrowser;
  readonly stage: Stage;
}

const LISTS: Record<ThemeStyleId, Component<ThemeListProps>> = {
  code: CodeList,
  orb: OrbList,
  aa: AaList,
  palette: PaletteList,
  window: WindowList,
};

const MODES: {label: string; value: ThemeMode}[] = [
  {label: 'All', value: 'all'},
  {label: 'Dark', value: 'dark'},
  {label: 'Light', value: 'light'},
];

/** What a layout sets on the theme picker it places. */
export interface ThemePickerSlotProps {
  /** Size of the kit fields: `md` on touch layouts. */
  readonly size?: 'sm' | 'md';
  /** Focuses the selected theme on mount, for pickers that open in a tray or a sheet. */
  readonly autofocus?: boolean;
  /** After a click or Enter applied a theme. */
  readonly onPick?: (theme: ThemeEntry, byKeyboard: boolean) => void;
  /** Lets the Escape that ends a preview reach the layout too, so a tray closes with one press. */
  readonly releaseEscape?: boolean;
}

export interface ThemePickerProps extends ThemePickerSlotProps {
  readonly model: EditorControlsModel;
  readonly stage: Stage;
  readonly style: ThemeStyleId;
}

/**
 * Search, the dark and light filter, and every theme in one style. It fills
 * the container it is given, and the columns follow its width. Hover, focus
 * and the arrow keys preview through the model; a click or Enter applies.
 */
export function ThemePicker(props: ThemePickerProps) {
  // oxlint-disable-next-line solid/reactivity -- one model lives for the whole session
  const browser = createThemeBrowser(props.model, {
    onPick: (theme, byKeyboard) => props.onPick?.(theme, byKeyboard),
    // oxlint-disable-next-line solid/reactivity -- a layout sets it once
    releaseEscape: props.releaseEscape,
  });
  onCleanup(() => props.model.endPreview());
  onMount(() => {
    if (props.autofocus) browser.focusSelected();
  });

  const showAll = () => {
    browser.setQuery('');
    browser.setMode('all');
  };

  return (
    <div class={styles.root} data-theme-style={props.style}>
      <div class={styles.tools}>
        <div
          class={styles.search}
          on:keydown={(event: KeyboardEvent) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              browser.focusFirst();
            } else if (event.key === 'Escape' && browser.query()) {
              // Clears the search first; a second Escape reaches the layout.
              event.stopPropagation();
              browser.setQuery('');
            }
          }}
        >
          <TextField
            size={props.size ?? 'sm'}
            placeholder="Search themes…"
            // The kit labels its root, not the input.
            ref={input => input.setAttribute('aria-label', 'Search themes')}
            value={browser.query()}
            onChange={browser.setQuery}
          />
        </div>
        <div class={styles.filter}>
          <SegmentedField
            size={props.size ?? 'sm'}
            adapt
            value={browser.mode()}
            onChange={browser.setMode}
            items={MODES}
          />
        </div>
      </div>
      <div
        class={styles.list}
        data-theme-list
        // The list stops the arrows and Escape it uses; digits and letters still switch the prototype.
        data-passes-keys
        {...browser.listProps}
      >
        <Show
          when={browser.themes().length > 0}
          fallback={
            <div class={styles.empty}>
              <p>No theme matches “{browser.query()}”.</p>
              <Button size="sm" theme="secondary" onClick={showAll}>
                Show all themes
              </Button>
            </div>
          }
        >
          <Dynamic
            component={LISTS[props.style]}
            browser={browser}
            stage={props.stage}
          />
        </Show>
      </div>
    </div>
  );
}
