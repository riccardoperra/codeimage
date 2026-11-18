import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {TextField} from '@codeimage/ui';
import {Button} from '@ui/legacy-controls';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {Component} from 'solid-js';
import {onCleanup, onSettled, untrack, Show} from 'solid-js';
import {Dynamic} from '@solidjs/web';
import type {EditorControlsModel, ThemeEntry} from '../model';
import type {Stage} from '../stage';
import {AaList} from './aa-list';
import type {ThemeBrowser} from './browser';
import {createThemeBrowser} from './browser';
import {OrbList} from './orb';
import * as styles from './picker.css';
import type {ThemeStyleId} from './style';
import {WindowList} from './window';

export interface ThemeListProps {
  readonly browser: ThemeBrowser;
  readonly stage: Stage;
}

const LISTS: Record<ThemeStyleId, Component<ThemeListProps>> = {
  orb: OrbList,
  aa: AaList,
  window: WindowList,
};

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
  const [t] = useI18n<AppLocaleEntries>();
  // oxlint-disable-next-line solid/reactivity -- one model lives for the whole session
  const browser = createThemeBrowser(props.model, {
    onPick: (theme, byKeyboard) => props.onPick?.(theme, byKeyboard),
    // oxlint-disable-next-line solid/reactivity -- a layout sets it once
    releaseEscape: props.releaseEscape,
  });
  onCleanup(() => props.model.endPreview());
  onSettled(() => {
    if (untrack(() => props.autofocus)) browser.focusSelected();
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
          onKeyDown={(event: KeyboardEvent) => {
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
            size={props.size === 'md' ? 'base' : 'sm'}
            placeholder={t('themeSwitcher.search')}
            type="text"
            aria-label={t('editor.searchThemes')}
            value={browser.query()}
            onChange={browser.setQuery}
          />
        </div>
        <div class={styles.filter} data-size={props.size ?? 'sm'}>
          <SegmentedField
            size={props.size ?? 'sm'}
            adapt
            value={browser.mode()}
            onChange={browser.setMode}
            items={[
              {label: t('editor.all'), value: 'all'},
              {label: t('editor.dark'), value: 'dark'},
              {label: t('editor.light'), value: 'light'},
            ]}
          />
        </div>
      </div>
      <div class={styles.list} data-theme-list {...browser.listProps}>
        <Show
          when={browser.themes().length > 0}
          fallback={
            <div class={styles.empty}>
              <p>{t('editor.noTheme', {query: browser.query()})}</p>
              <Button size="sm" theme="secondary" onClick={showAll}>
                {t('editor.showThemes')}
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
