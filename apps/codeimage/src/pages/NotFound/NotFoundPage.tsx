import {useI18n} from '@codeimage/locale';
import {Box, Text} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import type {AppLocaleEntries} from '../../i18n';
import * as styles from './NotFoundPage.css';

export default function NotFoundPage() {
  const [t] = useI18n<AppLocaleEntries>();

  return (
    <div class={styles.wrapper}>
      <Text class={styles.notFoundTitle}>{t('notFound.title')}</Text>
      <Text class={styles.descriptionTitle}>{t('notFound.description')}</Text>
      <Box marginTop={12}>
        <Button
          size={'md'}
          variant={'primary'}
          as="a"
          href={'/'}
          style={{'text-decoration': 'unset'}}
        >
          {t('notFound.goToHome')}
        </Button>
      </Box>
    </div>
  );
}
