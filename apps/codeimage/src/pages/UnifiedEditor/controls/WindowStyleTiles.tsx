import {getRootEditorStore} from '@codeimage/store/editor';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';
import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../i18n';
import type {SelectControl} from '../model';
import {RadioGroup} from '@kobalte/core/radio-group';
import {For, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import * as styles from './controls.css';

/**
 * Every window style as a tile with its preview, in place of today's modal
 * picker. It writes the terminal store and sends the event as the production
 * picker does.
 */
export function WindowStyleTiles(props: {control: SelectControl}) {
  const [t] = useI18n<AppLocaleEntries>();
  const terminal = getTerminalState();
  const editor = getRootEditorStore();

  return (
    <RadioGroup
      class={styles.windowGrid}
      aria-label={t('editor.windowStyle')}
      value={props.control.value()}
      onChange={props.control.set}
    >
      <For each={Object.values(AVAILABLE_TERMINAL_THEMES.entries)}>
        {entry => (
          <RadioGroup.Item value={entry.name} class={styles.windowTile}>
            <RadioGroup.ItemInput />
            <RadioGroup.ItemLabel class={styles.windowTileLabel}>
              <span class={styles.visuallyHidden}>{t(entry.label)}</span>
            </RadioGroup.ItemLabel>
            <div class={styles.windowTilePreview} aria-hidden="true">
              <Suspense>
                <Dynamic
                  component={entry.component}
                  lite
                  preview={true}
                  surface={terminal.state.surface}
                  shadow={TERMINAL_SHADOWS.md}
                  showTab={true}
                  textColor={terminal.state.textColor}
                  background={terminal.state.background}
                  accentVisible={terminal.state.accentVisible}
                  readonlyTab={true}
                  showHeader={true}
                  showWatermark={false}
                  alternativeTheme={false}
                  opacity={100}
                  themeId={editor.state.options.themeId}
                  showGlassReflection={false}
                  borderType={null}
                />
              </Suspense>
            </div>
            <span class={styles.windowTileCaption} aria-hidden="true">
              {t(entry.label)}
            </span>
          </RadioGroup.Item>
        )}
      </For>
    </RadioGroup>
  );
}
