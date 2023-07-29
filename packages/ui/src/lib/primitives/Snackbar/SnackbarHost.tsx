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

type Toast = typeof $toast;

let toast: {
  success: AugmentedToastHandler;
  error: AugmentedToastHandler;
  custom: AugmentedToastHandler;
  default: ToastHandler;
  remove: Toast['remove'];
  dismiss: Toast['dismiss'];
};

interface SnackbarHostProps {
  containerClassName?: string;
}

export function SnackbarHost(props: VoidProps<SnackbarHostProps>) {
  toast = {
    success: createPatch($toast, 'success'),
    error: createPatch($toast, 'error'),
    custom: createPatch($toast, 'custom'),
    default: $toast,
    remove: $toast.remove,
    dismiss: $toast.dismiss,
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
