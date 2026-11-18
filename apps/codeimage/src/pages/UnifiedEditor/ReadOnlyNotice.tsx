import {useI18n} from '@codeimage/locale';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {lazy, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import type {EditorPageState} from './page-state';
import * as styles from './snippet.css';

const ReadOnlyNoticeIsland = lazy(() => import('./ReadOnlyNoticeIsland'));

export function ReadOnlyNotice(props: {state: EditorPageState}) {
  const [t] = useI18n<AppLocaleEntries>();
  const sync = getEditorSyncAdapter();

  async function clone() {
    await sync?.clone();
  }

  return (
    <Show when={props.state.kind === 'read-only'}>
      <ReadOnlyNoticeIsland
        title={t('readOnlyBanner.title')}
        cloneLabel={t('common.clone')}
        bannerClass={styles.notice}
        titleClass={styles.noticeText}
        buttonClass={styles.noticeButton}
        onClone={clone}
      />
    </Show>
  );
}
