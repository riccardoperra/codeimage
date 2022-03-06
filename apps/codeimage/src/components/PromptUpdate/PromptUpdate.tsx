import {Component, createEffect} from 'solid-js';
import {useRegisterSW} from 'virtual:pwa-register/solid';
import styles from './ReloadPrompt.module.css';
import {notificationStore} from '../ui/Toast/SnackbarHost';
import {Button} from '../ui/Button/Button';
import {Box} from '../ui/Box/Box';

const ReloadPrompt: Component = () => {
  let toastId: string;
  // replaced dynamically
  const reloadSW = '__RELOAD_SW__';
  const {
    needRefresh: [needRefresh, setNeedRefresh],
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
    if (true || offlineReady() || needRefresh()) {
      toastId = notificationStore.create({
        message: `New content available, click on reload button to update`,
        closeable: false,
        actions: () => (
          <Box flexGrow={1}>
            <Button
              theme={'primary'}
              variant={'solid'}
              // class={styles.ToastButton}
              onClick={() => updateServiceWorker(true)}
            >
              Reload
            </Button>
          </Box>
        ),
      });
    } else {
      notificationStore.remove(toastId);
    }
  });

  return (
    <></>
    // <div class={styles.Container}>
    //   <Show when={true}>
    //     {/*<Show when={offlineReady() || needRefresh()}>*/}
    //     <div class={styles.Toast}>
    //       <div class={styles.Message}>
    //         <Show
    //           fallback={
    //             <span>
    //               New content available, click on reload button to update.
    //             </span>
    //           }
    //           when={offlineReady()}
    //         >
    //           <span>App ready to work offline</span>
    //         </Show>
    //       </div>
    //       <Show when={needRefresh()}>
    //         <button
    //           class={styles.ToastButton}
    //           onClick={() => updateServiceWorker(true)}
    //         >
    //           Reload
    //         </button>
    //       </Show>
    //       <button class={styles.ToastButton} onClick={() => close()}>
    //         Close
    //       </button>
    //     </div>
    //   </Show>
    // </div>
  );
};

export default ReloadPrompt;
