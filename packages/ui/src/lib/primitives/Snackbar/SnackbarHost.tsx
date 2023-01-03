import {Component, VoidProps} from 'solid-js';
import {toast as $toast, Toaster as ToasterV2, ToastHandler} from 'solid-toast';
import {AugmentedToastHandler, createPatch} from './patch-solid-toast';
import * as styles from './Snackbar.css';

export interface SnackbarData {
  message: string | Component;
  closeable?: boolean;
  actions?: Component;
  wrapper?: Component;
}

let toast: {
  success: AugmentedToastHandler;
  error: AugmentedToastHandler;
  custom: typeof $toast['custom'];
  default: ToastHandler;
  remove: typeof $toast['remove'];
};

interface SnackbarHostProps {
  containerClassName?: string;
}

export function SnackbarHost(props: VoidProps<SnackbarHostProps>) {
  toast = {
    success: createPatch($toast, 'success'),
    error: createPatch($toast, 'error'),
    custom: $toast.custom,
    default: $toast,
    remove: $toast.remove,
  };
  return (
    <ToasterV2
      containerClassName={props.containerClassName}
      toastOptions={{
        className: styles.snackbar,
        style: {},
      }}
    />
  );
}

export {toast};
