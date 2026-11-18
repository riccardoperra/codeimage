import type {TerminalState} from '@codeimage/store/editor/model';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../i18n';
import type {ChoiceControl} from './fields';
import {RadioGroup} from '@ui/RadioGroup/RadioGroup';
import type {JSX} from '@solidjs/web';
import {For, Show} from 'solid-js';
import * as styles from './controls.css';
import {WindowPreview} from './WindowPreview';

/** Each option of a choice as a tile drawn by `art`, captioned with its label. */
function PreviewTiles(props: {
  control: ChoiceControl;
  id?: string;
  label: string;
  compact?: boolean;
  art: (key: string) => JSX.Element;
}) {
  return (
    <RadioGroup
      id={props.id}
      class={styles.windowGrid}
      data-compact={props.compact || undefined}
      aria-label={props.label}
      value={props.control.value()}
      onChange={props.control.set}
    >
      <For each={props.control.options()}>
        {option => (
          <RadioGroup.Item value={option.key} class={styles.windowTile}>
            <RadioGroup.ItemInput />
            <RadioGroup.ItemLabel class={styles.windowTileLabel}>
              <span class={styles.visuallyHidden}>{option.label}</span>
            </RadioGroup.ItemLabel>
            <div class={styles.windowTileArt} aria-hidden="true">
              <div class={styles.windowTilePreview}>
                {props.art(option.key)}
              </div>
            </div>
            <span class={styles.windowTileCaption} aria-hidden="true">
              {option.label}
            </span>
          </RadioGroup.Item>
        )}
      </For>
    </RadioGroup>
  );
}

/**
 * Every window style as a tile with its preview, in place of today's modal
 * picker. It writes the terminal store and sends the event as the production
 * picker does.
 */
export function WindowStyleTiles(props: {control: ChoiceControl}) {
  const [t] = useI18n<AppLocaleEntries>();
  const terminal = getTerminalState();
  return (
    <PreviewTiles
      control={props.control}
      label={t('editor.windowStyle')}
      art={style => (
        <WindowPreview style={style} surface={terminal.state.surface} />
      )}
    />
  );
}

const SURFACES = [
  'solid',
  'wash',
] as const satisfies readonly TerminalState['surface'][];

/** The current window drawn with each surface, with a few lines of code to show the body. */
export function SurfaceTiles(props: {control: ChoiceControl; id: string}) {
  const terminal = getTerminalState();
  return (
    <PreviewTiles
      control={props.control}
      id={props.id}
      label={props.control.label()}
      compact
      art={key => (
        <Show when={SURFACES.find(surface => surface === key)}>
          {surface => (
            <WindowPreview style={terminal.state.type} surface={surface()}>
              <div class={styles.codeLines}>
                <span />
                <span />
              </div>
            </WindowPreview>
          )}
        </Show>
      )}
    />
  );
}
