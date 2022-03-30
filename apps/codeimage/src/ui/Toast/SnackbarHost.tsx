import {Toaster, ToasterStore, Transition, useToaster} from 'solid-headless';
import {Component, For} from 'solid-js';
import {SnackBar} from './Snackbar';
import * as styles from './Snackbar.css';
import {host} from './Snackbar.css';
import {PortalHostInjector} from '../PortalHost/PortalHost';

export interface SnackbarData {
  message: string | Component;
  closeable?: boolean;
  actions?: Component;
}

export const notificationStore = new ToasterStore<SnackbarData>();

export const NotificationHandler = () => {
  const notifications = useToaster(notificationStore);

  function clearNotifications() {
    notificationStore.clear();
  }

  return (
    <PortalHostInjector>
      <Toaster class={styles.hostWrapper}>
        <Transition
          show={notifications().length > 0}
          class="relative transition"
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-50 translate-y-full"
          enterTo="opacity-100 scale-100 translate-y-0"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100 translate-y-0"
          leaveTo="opacity-0 scale-50 translate-y-full"
          afterLeave={clearNotifications}
        >
          <div class={host}>
            <For each={notifications()}>
              {item => (
                <SnackBar
                  id={item.id}
                  message={item.data.message}
                  closeable={item.data.closeable}
                  actions={item.data.actions}
                />
              )}
            </For>
          </div>
        </Transition>
      </Toaster>
    </PortalHostInjector>
  );
};
