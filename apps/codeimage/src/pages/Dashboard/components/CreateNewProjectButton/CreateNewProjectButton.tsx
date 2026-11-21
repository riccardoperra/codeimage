import {useI18n} from '@codeimage/locale';
import {LoadingCircle} from '@codeimage/ui';
import {editorNotifications, notifications} from '@ui/notifications';
import {Button} from '@codeui/kit';
import {createAsyncAction} from '@core/hooks/async-action';
import {useNavigate} from '@solidjs/router';
import {PlusIcon} from '../../../../components/Icons/PlusIcon';
import type {AppLocaleEntries} from '../../../../i18n';
import {getDashboardState} from '../../dashboard.state';

export function CreateNewProjectButton() {
  const navigate = useNavigate();
  const dashboard = getDashboardState();
  const [t] = useI18n<AppLocaleEntries>();
  const [data, {notify}] = createAsyncAction(createNew);

  async function createNew() {
    try {
      const result = await dashboard?.createNewProject();
      if (!result) return;
      editorNotifications.show({
        tone: 'success',
        description: t('dashboard.projectCreateSuccess'),
        theme: 'page',
        duration: 2000,
      });
      navigate(`/${result.id}`);
    } catch {
      notifications.show({
        tone: 'danger',
        description: t('dashboard.errorCreatingProject'),
        theme: 'page',
      });
    }
  }

  return (
    <Button
      leftIcon={data.loading ? <LoadingCircle /> : <PlusIcon />}
      size={'md'}
      variant="primary"
      onClick={() => notify()}
    >
      {t('dashboard.new')}
    </Button>
  );
}
