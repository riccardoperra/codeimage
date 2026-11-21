import type {JSX} from '@solidjs/web';
import clsx from 'clsx';
import type {Component, VoidProps} from 'solid-js';
import {createComponent, For} from 'solid-js';
import {FadeInOutWithScaleTransition} from '../Transition';
import type {ToastEntry} from './toast-state';
import {positions, toast, toastEntries} from './toast-state';
import * as styles from './Snackbar.css';

export interface SnackbarData {
  message: string | Component;
  closeable?: boolean;
  actions?: Component;
  wrapper?: Component;
}

interface SnackbarHostProps {
  containerClassName?: string;
}

export function SnackbarHost(props: VoidProps<SnackbarHostProps>): JSX.Element {
  return (
    <div class={clsx(styles.hostWrapper, props.containerClassName)}>
      <For each={positions}>
        {position => (
          <div class={clsx(styles.host, styles.position[position])}>
            <For
              each={toastEntries().filter(entry => entry.position === position)}
              keyed={entry => entry.id}
            >
              {entry => (
                <FadeInOutWithScaleTransition show={entry().visible}>
                  <div data-cui-theme={entry().theme}>
                    <div
                      role="status"
                      aria-live="polite"
                      class={clsx(
                        styles.snackbar,
                        styles.toastItem,
                        entry().className,
                      )}
                      style={entry().style}
                    >
                      {entry().icon ?? icon(entry().kind)}
                      <div class={styles.message}>{message(entry())}</div>
                    </div>
                  </div>
                </FadeInOutWithScaleTransition>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}

function message(entry: ToastEntry) {
  const {message} = entry;
  return typeof message === 'function'
    ? createComponent(message, entry)
    : message;
}

function icon(kind: string) {
  if (kind === 'success')
    return (
      <span class={styles.success} aria-hidden="true">
        ✓
      </span>
    );
  if (kind === 'error')
    return (
      <span class={styles.error} aria-hidden="true">
        ×
      </span>
    );
}

export {toast};
