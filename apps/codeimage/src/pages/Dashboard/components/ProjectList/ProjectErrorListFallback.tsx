import {useI18n} from '@codeimage/locale';
import {Box, Button, Text} from '@codeimage/ui';
import {VoidProps} from 'solid-js';
import {ExclamationAltIcon} from '../../../../components/Icons/Exclamation';
import {AppLocaleEntries} from '../../../../i18n';
import * as styles from './ProjectList.css';

interface Props {
  error?: unknown;

  onReload?(): void;
}

export function ProjectErrorListFallback(props: VoidProps<Props>) {
  const [t] = useI18n<AppLocaleEntries>();

  return (
    <div class={styles.fallbackContainer}>
      <ExclamationAltIcon size={'3x'} />
      <Text size={'2xl'} class={styles.fallbackTextTitle}>
        {t('dashboard.errorLoadingList.title')}
      </Text>
      <Text>{t('dashboard.errorLoadingList.description')}</Text>
      <Box marginTop={5}>
        <Button
          variant={'solid'}
          theme={'primary'}
          size={'md'}
          onClick={() => props.onReload?.()}
        >
          {t('common.reload')}
        </Button>
      </Box>
    </div>
  );
}
