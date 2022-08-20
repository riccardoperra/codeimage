import {Box, Button, Text} from '@codeimage/ui';
import {VoidProps} from 'solid-js';
import {ExclamationAltIcon} from '../../../../components/Icons/Exclamation';
import * as styles from './ProjectList.css';

interface Props {
  error?: unknown;

  onReload?(): void;
}

export function ProjectErrorListFallback(props: VoidProps<Props>) {
  // TODO: add i18n

  return (
    <div class={styles.fallbackContainer}>
      <ExclamationAltIcon size={'3x'} />
      <Text size={'2xl'} class={styles.fallbackTextTitle}>
        Something went wrong!
      </Text>
      <Text>Sorry! There was a problem with your request.</Text>
      <Box marginTop={5}>
        <Button
          variant={'solid'}
          theme={'primary'}
          size={'md'}
          onClick={() => props.onReload?.()}
        >
          Reload
        </Button>
      </Box>
    </div>
  );
}
