import {getAssetsStore} from '@codeimage/store/assets/assets';
import {Box, LoadingCircle, VStack} from '@codeimage/ui';
import type {JSX} from '@solidjs/web';
import type {VoidProps} from 'solid-js';
import {createEffect, Errored, omit, Show} from 'solid-js';
import {ExclamationIcon} from '../../components/Icons/Exclamation';

interface AssetsImageProps {
  assetId: string;
  onError?: () => void;
  onLoad?: () => void;
  fallback?: JSX.Element;
  errorFallback?: JSX.Element;
}

export function AssetsImage(
  props: VoidProps<
    AssetsImageProps & Omit<JSX.IntrinsicElements['img'], 'onError' | 'onLoad'>
  >,
) {
  const others = omit(
    props,
    'fallback',
    'errorFallback',
    'onError',
    'onLoad',
    'assetId',
  );
  const store = getAssetsStore();
  const [resolve] = store.loadAsync(() => props.assetId);

  createEffect(
    () => {
      if (resolve.state === 'errored') return props.onError;
      if (resolve.state === 'ready') return props.onLoad;
    },
    notify => {
      notify?.();
    },
  );

  return (
    <Errored
      fallback={
        props.errorFallback || (
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
        )
      }
    >
      <Show
        when={!resolve.loading}
        fallback={
          props.fallback || (
            <Box
              display={'flex'}
              alignItems={'center'}
              justifyContent={'center'}
              width={'100%'}
              height={'100%'}
            >
              <LoadingCircle />
            </Box>
          )
        }
      >
        <img
          width={'100%'}
          height={'100%'}
          src={resolve()}
          style={{
            'object-fit': 'cover',
          }}
          {...others}
        />
      </Show>
    </Errored>
  );
}
