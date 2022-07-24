import {Box, Button, SegmentedField, SegmentedFieldItem} from '@codeimage/ui';
import {useNavigate} from 'solid-app-router';
import {GridIcon, ListIcon} from '../../../../components/Icons/Grid';
import {PlusIcon} from '../../../../components/Icons/PlusIcon';
import {getDashboardState} from '../../dashboard.state';
import * as styles from './ProjectToolbar.css';

export function ProjectToolbar() {
  const navigate = useNavigate();
  const dashboard = getDashboardState()!;

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
      <Button theme="primary" variant="solid" onClick={() => createNew()}>
        <PlusIcon size={'sm'} />
        <Box as={'span'} marginLeft={2}>
          New
        </Box>
      </Button>
    </Box>
  );
}
