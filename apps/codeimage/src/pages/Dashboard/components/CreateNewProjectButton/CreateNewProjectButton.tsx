import {useI18n} from '@codeimage/locale';
import {Box, Button, Loading, toast} from '@codeimage/ui';
import {createAsyncAction} from '@core/hooks/async-action';
import {useNavigate} from '@solidjs/router';
import {Show} from 'solid-js';
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
        duration: 100000,
      });
      navigate(`/${result.id}`);
    } catch (e) {
      toast.error(t('dashboard.errorCreatingProject'));
    }
  }

  return (
    <Button theme="primary" variant="solid" onClick={() => notify()}>
      <Show when={data.loading} fallback={<PlusIcon size={'sm'} />}>
        <Loading size={'sm'} />
      </Show>
      <Box as={'span'} marginLeft={2}>
        {t('dashboard.new')}
      </Box>
    </Button>
  );
}
