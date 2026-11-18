import {useI18n} from '@codeimage/locale';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {createSignal, flush, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import {ReadOnlyCloneButton} from './ReadOnlyCloneButton';
import type {EditorPageState} from './page-state';
import * as styles from './snippet.css';

export function ReadOnlyNotice(props: {state: EditorPageState}) {
  const [t] = useI18n<AppLocaleEntries>();
  const sync = getEditorSyncAdapter();
  const [pending, setPending] = createSignal(false);

  async function clone() {
    if (pending()) return;
    flush(() => setPending(true));
    try {
      await sync?.clone();
    } catch {
      return;
    } finally {
      setPending(false);
    }
  }

  return (
    <Show when={props.state.kind === 'read-only'}>
      <div class={styles.notice} data-read-only-banner>
        <span class={styles.noticeText}>{t('readOnlyBanner.title')}</span>
        <ReadOnlyCloneButton
          label={t('common.clone')}
          pending={pending()}
          buttonClass={styles.noticeButton}
          onClick={clone}
        />
      </div>
    </Show>
  );
}
