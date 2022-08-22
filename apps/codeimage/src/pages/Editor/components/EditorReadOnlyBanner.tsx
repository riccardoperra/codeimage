import {useI18n} from '@codeimage/locale';
import {Box, Button} from '@codeimage/ui';
import {useAsyncAction} from '@core/hooks/async-action';
import {VoidProps} from 'solid-js';
import {HintIcon} from '../../../components/Icons/Hint';
import {AppLocaleEntries} from '../../../i18n';
import * as styles from './EditorReadOnlyBanner.css';

interface EditorReadOnlyBannerProps {
  onClone: () => Promise<void>;
}

export function EditorReadOnlyBanner(
  props: VoidProps<EditorReadOnlyBannerProps>,
) {
  const [cloneAction, {notify: onClone}] = useAsyncAction(() =>
    props.onClone(),
  );

  const [t] = useI18n<AppLocaleEntries>();

  return (
    <div class={styles.banner}>
      <HintIcon />
      <Box marginLeft={2}>{t('readOnlyBanner.title')}</Box>
      <Box marginLeft={3}>
        <Button
          variant={'solid'}
          theme={'primary'}
          loading={cloneAction.loading}
          onClick={onClone}
        >
          {t('common.clone')}
        </Button>
      </Box>
    </div>
  );
}
