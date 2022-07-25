import {
  Box,
  Button,
  LoadingOverlay,
  SegmentedField,
  SegmentedFieldItem,
} from '@codeimage/ui';
import {useAsyncAction} from '@core/hooks/async-action';
import {useNavigate} from 'solid-app-router';
import {Show} from 'solid-js';
import {GridIcon, ListIcon} from '../../../../components/Icons/Grid';
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

  const tableModeItems: SegmentedFieldItem<'grid' | 'list'>[] = [
    {
      label: () => <GridIcon />,
      value: 'grid',
    },
    {
      label: () => <ListIcon />,
      value: 'list',
    },
  ];

  return (
    <Box display={'flex'} marginBottom={8}>
      <Show when={data.loading}>
        <LoadingOverlay overlay={true} size={'3x'} />
      </Show>
      <h1 class={styles.title}>Workspace</h1>
      <div style={{flex: 1}} />
      <Box display={'flex'} style={{width: '80px'}} marginRight={3}>
        <SegmentedField
          size={'sm'}
          value={dashboard.mode()}
          onChange={dashboard.setMode}
          items={tableModeItems}
        />
      </Box>
      <Button theme="primary" variant="solid" onClick={() => notify(0)}>
        <PlusIcon size={'sm'} />
        <Box as={'span'} marginLeft={2}>
          New
        </Box>
      </Button>
    </Box>
  );
}
