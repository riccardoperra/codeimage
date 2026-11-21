import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {icons} from '@ui/kit-icons';
import {Button} from '@codeui/kit';
import {createSignal, Show} from 'solid-js';
import {createPrettierFormatter} from '../../../hooks/createPrettierFormatter';
import type {AppLocaleEntries} from '../../../i18n';
import {formatTab} from './format-tab';
import * as styles from './tool-activity.css';

/**
 * Formats the tab an agent wrote, as Format code does, from the call's row.
 * The tab is found by its editor id, so renames, moves and closed tabs before
 * it do not matter.
 */
export function FormatTabButton(props: {tabId: string}) {
  const [t] = useI18n<AppLocaleEntries>();
  const editors = getRootEditorStore();
  const active = getActiveEditorStore();
  const tab = () =>
    editors.state.editors.find(editor => editor.id === props.tabId);
  const formatter = createPrettierFormatter(
    () => tab()?.languageId ?? '',
    () => tab()?.tab.tabName ?? '',
    () => tab()?.formatter ?? null,
  );
  const [state, setState] = createSignal<'idle' | 'running' | 'done'>('idle');
  const name = () => tab()?.tab.tabName || t('agentActivity.untitled');
  const blocked = () =>
    !tab()
      ? t('agentActivity.tabClosed')
      : !formatter.canFormat()
        ? t('agentActivity.noFormatter')
        : undefined;

  const run = async () => {
    setState('running');
    const done = await formatTab(
      {
        editors: () => editors.state.editors,
        isActive: editors.isActive,
        select: editors.actions.setActiveEditorId,
        format: () => active.format(),
      },
      props.tabId,
    );
    setState(done ? 'done' : 'idle');
  };

  return (
    <Show
      when={state() !== 'done'}
      fallback={
        <span class={styles.formatted} data-format-tab="done">
          <icons.CheckIcon class={styles.icon} />
          {t('agentActivity.formatted')}
        </span>
      }
    >
      <Button
        class={styles.formatButton}
        size="xs"
        variant="secondary"
        ghost
        loading={state() === 'running'}
        disabled={!!blocked()}
        title={blocked() ?? t('agentActivity.formatTab', {name: name()})}
        aria-label={t('agentActivity.formatTab', {name: name()})}
        data-format-tab
        onClick={() => void run()}
      >
        {t('agentActivity.format')}
      </Button>
    </Show>
  );
}
