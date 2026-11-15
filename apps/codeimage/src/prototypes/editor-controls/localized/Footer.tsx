import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../i18n';
import {Box, Link} from '@codeimage/ui';
import {getUmami} from '@core/constants/umami';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {Changelog} from '../../../components/Changelog/Changelog';
import {link} from '../../../components/Footer/Footer.css';
import * as styles from '../../../components/Footer/Footer.css';

export const Footer = () => {
  const [t] = useI18n<AppLocaleEntries>();
  const openDialog = createControlledDialog();

  return (
    <div class={styles.wrapper}>
      <Box display={'inlineFlex'} justifyContent={'flexEnd'} padding={1}>
        <Box marginRight={5}>
          <Link
            class={`${styles.link} ${styles.linkOnlyDesktop}`}
            target={'_blank'}
            title="Better Comments for GitHub"
            href={'https://github.com/riccardoperra/better-comments-for-github'}
            size="xs"
            onClick={() => getUmami().track('better-comments-for-github')}
          >
            Better Comments for GitHub
          </Link>
        </Box>
        <Box marginRight={5}>
          <Link
            class={link}
            href={'https://github.com/riccardoperra/codeimage'}
            size="xs"
          >
            GitHub
          </Link>
        </Box>

        <Box marginRight={5}>
          <Link
            as={'a'}
            class={link}
            href={'https://github.com/riccardoperra/codeimage/issues'}
            size="xs"
          >
            {t('editor.feedback')}
          </Link>
        </Box>

        <Box marginRight={5}>
          <Link
            class={link}
            as={'a'}
            href={'https://github.com/riccardoperra/codeimage/releases'}
            size="xs"
          >
            {t('editor.releases')}
          </Link>
        </Box>

        <Box>
          <Link
            class={link}
            as={'a'}
            size="xs"
            onClick={() => openDialog(Changelog, {latest: false})}
          >
            🎉
            <Box as={'span'} marginLeft={1}>
              {t('editor.whatsNew')}
            </Box>
          </Link>
        </Box>
      </Box>
    </div>
  );
};
