import {useI18n} from '@codeimage/locale';
import {Box, Text, VStack} from '@codeimage/ui';
import {Show} from 'solid-js';
import {EmptyBox} from '../../../../components/Icons/EmptyBox';
import {AppLocaleEntries} from '../../../../i18n';
import {getDashboardState} from '../../dashboard.state';
import {CreateNewProjectButton} from '../CreateNewProjectButton/CreateNewProjectButton';
import * as styles from './ProjectList.css';

export function ProjectEmptyListMessage() {
  const dashboard = getDashboardState()!;
  const [t] = useI18n<AppLocaleEntries>();

  const noMatchingProjects = () => {
    return (
      dashboard.search().length > 0 &&
      !dashboard.filteredData().length &&
      dashboard.data().length
    );
  };

  return (
    <div class={styles.fallbackContainer}>
      <EmptyBox />

      <VStack spacing={'2'} marginTop={6}>
        <Show
          when={noMatchingProjects()}
          fallback={
            <>
              <Text size={'2xl'} class={styles.fallbackTextTitle}>
                {t('dashboard.empty.title')}
              </Text>
              <Text
                // eslint-disable-next-line solid/no-innerhtml
                innerHTML={t('dashboard.empty.description')}
                size={'base'}
              />
              <Box marginTop={5}>
                <CreateNewProjectButton />
              </Box>
            </>
          }
        >
          <Text size={'2xl'} class={styles.fallbackTextTitle}>
            {t('dashboard.noMatchingProjects.title')}
          </Text>
          <Text
            size={'base'}
            // eslint-disable-next-line solid/no-innerhtml
            innerHTML={t('dashboard.noMatchingProjects.description')}
          />
        </Show>
      </VStack>
    </div>
  );
}
