import {Toaster, Transition} from 'solid-headless';
import {Component, createMemo, For} from 'solid-js';
import {SnackBar} from './Snackbar';
import * as styles from './Snackbar.css';
import {host} from './Snackbar.css';
import {PortalHostContext} from '../PortalHost';
import {useSnackbar} from './snackbar.store';

export interface SnackbarData {
  message: string | Component;
  closeable?: boolean;
  actions?: Component;
  wrapper?: Component;
}

export const SnackbarHost = () => {
  const [_snackbars, store] = useSnackbar();
  const snackbars = createMemo(_snackbars);

  function clearNotifications() {
    store.clear();
  }

  return (
    <PortalHostContext>
      <Toaster class={styles.hostWrapper}>
        <Transition
          show={snackbars().length > 0}
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
            <For each={snackbars()}>
              {item => (
                <SnackBar
                  id={item.id}
                  message={item.data.message}
                  closeable={item.data.closeable}
                  actions={item.data.actions}
                  wrapper={item.data.wrapper}
                />
              )}
            </For>
          </div>
        </Transition>
      </Toaster>
    </PortalHostContext>
  );
};
