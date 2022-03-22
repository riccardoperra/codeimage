import {Component, createEffect} from 'solid-js';
import {useRegisterSW} from 'virtual:pwa-register/solid';
import {notificationStore} from '../ui/Toast/SnackbarHost';
import {Button} from '../ui/Button/Button';
import {Box} from '../ui/Box/Box';
import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';

const PromptMessage: Component<{offline: boolean}> = props => {
  const [t] = useI18n<AppLocaleEntries>();
  return <>{props.offline ? t('pwa.offline') : t('pwa.update')}</>;
};

const ReloadPrompt: Component = () => {
  let toastId: string;

  // replaced dynamically
  const reloadSW = '__RELOAD_SW__';
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegistered(swRegister) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (reloadSW === 'true') {
        swRegister &&
          setInterval(() => {
            // eslint-disable-next-line no-console
            console.log('Checking for sw update');
            swRegister.update();
          }, 20000 /* 20s for testing purposes */);
      } else {
        // eslint-disable-next-line no-console
        console.log(`SW Registered: ${swRegister}`);
      }
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
    const offline = false;
    const refresh = needRefresh();
    if (offline || refresh) {
      toastId = notificationStore.create({
        message: () => <PromptMessage offline={offline} />,
        closeable: false,
        actions: () => {
          const [t] = useI18n<AppLocaleEntries>();
          return (
            <Box flexGrow={1}>
              <Button
                theme={'primary'}
                variant={'solid'}
                onClick={() => {
                  if (offline) {
                    close();
                  }
                  if (refresh) {
                    updateServiceWorker(true).then();
                  }
                }}
              >
                {offline ? t('pwa.close') : t('pwa.reload')}
              </Button>
            </Box>
          );
        },
      });
    } else {
      notificationStore.remove(toastId);
    }
  });

  return <></>;
};

export default ReloadPrompt;
