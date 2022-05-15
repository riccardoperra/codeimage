import {Box, Button, useSnackbarStore} from '@codeimage/ui';
import {createEffect} from 'solid-js';
import {useRegisterSW} from 'virtual:pwa-register/solid';
import {InvertedThemeWrapper} from '../ui/InvertedThemeWrapper/InvertedThemeWrapper';

export const useServiceWorkerPrompt = () => {
  const notificationStore = useSnackbarStore();
  let toastId: string;
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegistered(swRegister) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      console.log(swRegister);
      console.log(`SW Registered: ${swRegister}`);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(() => false);
    setNeedRefresh(() => false);
  };

  createEffect(() => {
    if (offlineReady() || needRefresh()) {
      toastId = notificationStore.create({
        wrapper: InvertedThemeWrapper,
        message: offlineReady()
          ? `App ready to work offline`
          : `New content available, click on reload button to update`,
        closeable: false,
        actions: () => (
          <Box flexGrow={1}>
            <Button
              theme={'primary'}
              variant={'solid'}
              onClick={() => {
                if (offlineReady()) {
                  close();
                }
                if (needRefresh()) {
                  updateServiceWorker(true).then();
                } else {
                  location.reload();
                }
              }}
            >
              {'Reload'}
            </Button>
          </Box>
        ),
      });
    } else {
      notificationStore.remove(toastId);
    }
  });
};
