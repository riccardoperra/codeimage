import {useI18n} from '@codeimage/locale';
import {Button, toast} from '@codeimage/ui';
import {createAsyncAction} from '@core/hooks/async-action';
import {useNavigate} from '@solidjs/router';
import {PlusIcon} from '../../../../components/Icons/PlusIcon';
import {AppLocaleEntries} from '../../../../i18n';
import {getDashboardState} from '../../dashboard.state';

export function CreateNewProjectButton() {
  const navigate = useNavigate();
  const dashboard = getDashboardState()!;
  const [t] = useI18n<AppLocaleEntries>();
  const [data, {notify}] = createAsyncAction(createNew);

  async function createNew() {
    try {
      const result = await dashboard?.createNewProject();
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
    <Button
      loading={data.loading}
      leftIcon={<PlusIcon />}
      theme="primary"
      variant="solid"
      onClick={() => notify()}
    >
      {t('dashboard.new')}
    </Button>
  );
}
