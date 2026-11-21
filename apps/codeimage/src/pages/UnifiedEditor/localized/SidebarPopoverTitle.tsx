import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {Box, HStack, Text} from '@codeimage/ui';
import {IconButton} from '@codeui/kit';
import {
  ExperimentalFeatureTooltip,
  ExperimentalIcon,
} from './ExperimentalFeatureTooltip';
import type {FlowProps} from 'solid-js';
import {Show} from 'solid-js';
import {CloseIcon} from '../../../components/Icons/CloseIcon';
import * as styles from '../../../components/PropertyEditor/SidebarPopover/SidebarPopover.css';

interface SidebarPopoverTitleProps {
  onClose: () => void;

  experimental?: boolean;
  featureName?: string;
}
export function SidebarPopoverTitle(
  props: FlowProps<SidebarPopoverTitleProps>,
) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Box
      display={'flex'}
      justifyContent={'spaceBetween'}
      alignItems={'center'}
      marginBottom={4}
    >
      <ExperimentalFeatureTooltip
        feature={props.featureName ?? t('editor.thisFeature')}
      >
        <HStack spacing={'2'} alignItems={'flexEnd'}>
          <Text weight={'semibold'}>{props.children}</Text>
          <Show when={props.experimental}>
            <Text class={styles.experimentalFlag} size={'xs'}>
              <Box as={'span'} display={'flex'} alignItems={'center'}>
                <ExperimentalIcon size={'xs'} />
                <Box marginLeft={'1'}>{t('editor.experimental')}</Box>
              </Box>
            </Text>
          </Show>
        </HStack>
      </ExperimentalFeatureTooltip>

      <IconButton
        size={'xs'}
        aria-label={t('common.close')}
        variant={'secondary'}
        onClick={() => props.onClose()}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
