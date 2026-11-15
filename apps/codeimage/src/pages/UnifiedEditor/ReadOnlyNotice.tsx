import {useI18n} from '@codeimage/locale';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {LoadingCircle, Text} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {createAsyncAction} from '@core/hooks/async-action';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import type {EditorPageState} from './page-state';
import * as styles from './snippet.css';

export function ReadOnlyNotice(props: {state: EditorPageState}) {
  const [t] = useI18n<AppLocaleEntries>();
  const {clone} = getEditorSyncAdapter()!;
  const [action, {notify}] = createAsyncAction(clone);
  return (
    <Show when={props.state.kind === 'read-only'}>
      <div class={styles.notice} data-read-only-banner>
        <Text size="sm">{t('readOnlyBanner.title')}</Text>
        <Button
          size="sm"
          theme="primary"
          disabled={action.loading}
          leftIcon={action.loading ? <LoadingCircle /> : undefined}
          onClick={notify}
        >
          {t('common.clone')}
        </Button>
      </div>
    </Show>
  );
}
