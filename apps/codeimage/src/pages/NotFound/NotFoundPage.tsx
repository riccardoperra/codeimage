import {useI18n} from '@codeimage/locale';
import {Box, Button, Text} from '@codeimage/ui';
import {Link} from '@solidjs/router';
import {AppLocaleEntries} from '../../i18n';
import * as styles from './NotFoundPage.css';

export default function NotFoundPage() {
  const [t] = useI18n<AppLocaleEntries>();

  return (
    <div class={styles.wrapper}>
      <Text class={styles.notFoundTitle}>{t('notFound.title')}</Text>
      <Text class={styles.descriptionTitle}>{t('notFound.description')}</Text>
      <Box marginTop={12}>
        <Button
          as={Link}
          href={'/'}
          size={'md'}
          variant={'solid'}
          theme={'primary'}
        >
          {t('notFound.goToHome')}
        </Button>
      </Box>
    </div>
  );
}
