import {useI18n} from '@codeimage/locale';
import {Box, Button, Text} from '@codeimage/ui';
import {createAsyncAction} from '@core/hooks/async-action';
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
  const [cloneAction, {notify: onClone}] = createAsyncAction(() =>
    props.onClone(),
  );

  const [t] = useI18n<AppLocaleEntries>();

  return (
    <div class={styles.banner}>
      <Box display={'flex'} alignItems={'center'}>
        <HintIcon size={'sm'} />
        <Box as={'span'} marginLeft={2}>
          <Text size={'sm'}>{t('readOnlyBanner.title')}</Text>
        </Box>
      </Box>
      <Button
        variant={'solid'}
        theme={'primary'}
        loading={cloneAction.loading}
        onClick={onClone}
        size={'xs'}
      >
        {t('common.clone')}
      </Button>
    </div>
  );
}
