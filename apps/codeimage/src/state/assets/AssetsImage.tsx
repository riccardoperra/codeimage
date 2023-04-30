import {getAssetsStore} from '@codeimage/store/assets/assets';
import {Box, LoadingCircle, VStack} from '@codeimage/ui';
import {createEffect, ErrorBoundary, JSX, Suspense, VoidProps} from 'solid-js';
import {ExclamationIcon} from '../../components/Icons/Exclamation';

interface AssetsImageProps {
  assetId: string;
  onError?: () => void;
  onLoad?: () => void;
}

export function AssetsImage(
  props: VoidProps<
    AssetsImageProps & Omit<JSX.IntrinsicElements['img'], 'onChange'>
  >,
) {
  const store = getAssetsStore();
  const [resolve] = store.loadAsync(() => props.assetId);

  createEffect(() => {
    switch (resolve.state) {
      case 'errored':
        return props.onError?.();
      case 'ready':
        return props.onLoad?.();
    }
  });

  return (
    <ErrorBoundary
      fallback={
        <VStack
          spacing={2}
          display={'flex'}
          alignItems={'center'}
          justifyContent={'center'}
          height={'100%'}
          width={'100%'}
          textAlign={'center'}
        >
          <ExclamationIcon size={'lg'} />
          Image cannot be loaded.
        </VStack>
      }
    >
      <Suspense
        fallback={
          <Box
            display={'flex'}
            alignItems={'center'}
            justifyContent={'center'}
            width={'100%'}
            height={'100%'}
          >
            <LoadingCircle />
          </Box>
        }
      >
        <img
          width={'100%'}
          height={'100%'}
          src={resolve()}
          style={{
            'object-fit': 'cover',
          }}
          {...props}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
