import {useI18n} from '@codeimage/locale';
import {Box, LoadingCircle, Text} from '@codeimage/ui';
import {Button} from '@codeui/kit';
import {createAsyncAction} from '@core/hooks/async-action';
import {type VoidProps} from 'solid-js';
import {HintIcon} from '../../../components/Icons/Hint';
import {type AppLocaleEntries} from '../../../i18n';
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
        theme={'primary'}
        leftIcon={cloneAction.loading ? <LoadingCircle /> : undefined}
        onClick={onClone}
        size={'xs'}
      >
        {t('common.clone')}
      </Button>
    </div>
  );
}
