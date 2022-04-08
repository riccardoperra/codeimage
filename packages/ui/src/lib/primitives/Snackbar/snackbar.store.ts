import {ToastData, ToasterStore, useToaster} from 'solid-headless';
import {SnackbarData} from './SnackbarHost';
import {Accessor} from 'solid-js';

const snackbarStore = new ToasterStore<SnackbarData>();

export function useSnackbarStore() {
  return snackbarStore;
}

export function useSnackbar(): [
  snackbars: Accessor<readonly ToastData<SnackbarData>[]>,
  store: ToasterStore<SnackbarData>,
] {
  const store = useSnackbarStore();
  const snackbars = useToaster(store);
  return [snackbars, snackbarStore];
}
