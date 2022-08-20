import {useI18n} from '@codeimage/locale';
import {Box, Button, Loading} from '@codeimage/ui';
import {useAsyncAction} from '@core/hooks/async-action';
import {useNavigate} from 'solid-app-router';
import {Show} from 'solid-js';
import {PlusIcon} from '../../../../components/Icons/PlusIcon';
import {AppLocaleEntries} from '../../../../i18n';
import {getDashboardState} from '../../dashboard.state';

export function CreateNewProjectButton() {
  const navigate = useNavigate();
  const dashboard = getDashboardState()!;
  const [t] = useI18n<AppLocaleEntries>();
  const [data, {notify}] = useAsyncAction(createNew);

  async function createNew() {
    const result = await dashboard?.createNewProject();
    if (!result) return;
    navigate(`/${result.id}`);
  }

  return (
    <Button theme="primary" variant="solid" onClick={() => notify(0)}>
      <Show when={data.loading} fallback={<PlusIcon size={'sm'} />}>
        <Loading size={'sm'} />
      </Show>
      <Box as={'span'} marginLeft={2}>
        {t('dashboard.new')}
      </Box>
    </Button>
  );
}
