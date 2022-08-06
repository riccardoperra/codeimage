import {Box, Button, FlexField, LoadingOverlay, TextField} from '@codeimage/ui';
import {useAsyncAction} from '@core/hooks/async-action';
import {useNavigate} from 'solid-app-router';
import {Show} from 'solid-js';
import {PlusIcon} from '../../../../components/Icons/PlusIcon';
import {getDashboardState} from '../../dashboard.state';
import * as styles from './ProjectToolbar.css';

export function ProjectToolbar() {
  const navigate = useNavigate();
  const dashboard = getDashboardState()!;
  const [data, {notify}] = useAsyncAction(createNew);

  async function createNew() {
    const result = await dashboard?.createNewProject();
    if (!result) return;
    navigate(`/${result.id}`);
  }

  return (
    <>
      <Box display={'flex'} marginBottom={2}>
        <Show when={data.loading}>
          <LoadingOverlay overlay={true} size={'3x'} />
        </Show>
        <h1 class={styles.title}>Workspace</h1>
        <div style={{flex: 1}} />
        <Button theme="primary" variant="solid" onClick={() => notify(0)}>
          <PlusIcon size={'sm'} />
          <Box as={'span'} marginLeft={2}>
            New
          </Box>
        </Button>
      </Box>
      <Box marginBottom={6}>
        <FlexField size={'lg'}>
          <TextField
            type={'text'}
            value={dashboard.search()}
            onChange={value => dashboard.setSearch(value)}
            placeholder={'Search'}
            inline={true}
          ></TextField>
        </FlexField>
      </Box>
    </>
  );
}
