import {useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {Button, IconButton, toast} from '@codeimage/ui';
import {createAsyncAction} from '@core/hooks/async-action';
import {useModality} from '@core/hooks/isMobile';
import {useNavigate} from '@solidjs/router';
import {Component, Show} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';
import {CloudIcon} from '../Icons/CloudIcon';

interface ShareButtonProps {
  showLabel?: boolean;
}

export const SyncRemoteButton: Component<ShareButtonProps> = props => {
  const authStore = getAuth0State();
  const editorStore = getEditorSyncAdapter()!;
  const navigate = useNavigate();
  const [t] = useI18n<AppLocaleEntries>();
  const modality = useModality();

  const [data, {notify: syncRemotely}] = createAsyncAction(syncFromLocalData);

  const canSyncRemotely = () =>
    authStore.loggedIn() && editorStore.isOnlyLocalSync();

  async function syncFromLocalData() {
    try {
      const result = await editorStore.syncFromLocalData();
      if (!result) return;
      toast.success(t('dashboard.projectCreateSuccess'), {
        position: 'bottom-center',
      });
      navigate(`/${result.id}`);
    } catch (e) {
      toast.error(t('dashboard.errorCreatingProject'));
    }
  }

  return (
    <Show when={canSyncRemotely()}>
      <Show
        fallback={() => (
          <IconButton
            loading={data.loading}
            size={modality === 'full' ? 'sm' : 'xs'}
            variant={'solid'}
            theme={'secondary'}
            onClick={syncRemotely}
          >
            <CloudIcon size={'sm'} />
          </IconButton>
        )}
        when={props.showLabel}
      >
        <Button
          aria-label={t('toolbar.share')}
          variant={'solid'}
          theme={'secondary'}
          loading={data.loading}
          onClick={syncRemotely}
          size={modality === 'full' ? 'sm' : 'xs'}
          leftIcon={() => <CloudIcon />}
        >
          {t('toolbar.saveProject')}
        </Button>
      </Show>
    </Show>
  );
};
