import {Box, Button, Text, VStack} from '@codeimage/ui';
import {VoidProps} from 'solid-js';
import {ExclamationIcon} from '../../../../components/Icons/Exclamation';

interface Props {
  error?: unknown;

  onReload?(): void;
}

export function ProjectErrorListFallback(props: VoidProps<Props>) {
  // TODO: add i18n

  return (
    <VStack
      spacing={'2'}
      display={'flex'}
      alignItems={'center'}
      justifyContent={'center'}
      flexDirection={'column'}
    >
      <ExclamationIcon size={'3x'} />
      {/*<EmptyBox />*/}
      <Text size={'4xl'}>Something went wrong!</Text>
      <Text size={'xl'}>Sorry! There was a problem with your request.</Text>
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
    </VStack>
  );
}
