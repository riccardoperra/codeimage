import {useI18n} from '@codeimage/locale';
import {Box, FlexField} from '@codeimage/ui';
import {TextField} from '@codeui/kit';
import {Show} from 'solid-js';
import {AppLocaleEntries} from '../../../../i18n';
import {getDashboardState} from '../../dashboard.state';
import {CreateNewProjectButton} from '../CreateNewProjectButton/CreateNewProjectButton';
import * as styles from './ProjectToolbar.css';

export function ProjectToolbar() {
  const dashboard = getDashboardState()!;
  const [t] = useI18n<AppLocaleEntries>();

  return (
    <>
      <Box display={'flex'} marginBottom={2}>
        <h1 class={styles.title}>{t('dashboard.myProjects')}</h1>
        <Box flexGrow={1} />
        <Show when={!dashboard.data.isEmpty()}>
          <CreateNewProjectButton />
        </Show>
      </Box>
      <div class={styles.container}>
        <Show when={!dashboard.data.isEmpty()}>
          <FlexField size={'lg'}>
            <TextField
              value={dashboard.search()}
              onChange={value => dashboard.setSearch(value)}
              placeholder={'Search'}
              theme={'inline'}
            />
          </FlexField>
        </Show>
      </div>
    </>
  );
}
