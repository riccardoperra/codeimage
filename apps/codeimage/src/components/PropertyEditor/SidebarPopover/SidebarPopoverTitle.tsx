import {Box, HStack, Text} from '@codeimage/ui';
import {IconButton} from '@codeui/kit';
import {
  ExperimentalFeatureTooltip,
  ExperimentalIcon,
} from '@ui/ExperimentalFeatureTooltip/ExperimentalFeatureTooltip';
import {type FlowProps, Show} from 'solid-js';
import {CloseIcon} from '../../Icons/CloseIcon';
import * as styles from './SidebarPopover.css';

interface SidebarPopoverTitleProps {
  onClose: () => void;

  experimental?: boolean;
  featureName?: string;
}
export function SidebarPopoverTitle(
  props: FlowProps<SidebarPopoverTitleProps>,
) {
  return (
    <Box
      display={'flex'}
      justifyContent={'spaceBetween'}
      alignItems={'center'}
      marginBottom={4}
    >
      <ExperimentalFeatureTooltip feature={props.featureName ?? 'This'}>
        <HStack spacing={'2'} alignItems={'flexEnd'}>
          <Text weight={'semibold'}>{props.children}</Text>
          <Show when={props.experimental}>
            <Text class={styles.experimentalFlag} size={'xs'}>
              <Box as={'span'} display={'flex'} alignItems={'center'}>
                <ExperimentalIcon size={'xs'} />
                <Box marginLeft={'1'}>Experimental</Box>
              </Box>
            </Text>
          </Show>
        </HStack>
      </ExperimentalFeatureTooltip>

      <IconButton
        size={'xs'}
        aria-label={'Close'}
        theme={'secondary'}
        onClick={() => props.onClose()}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
