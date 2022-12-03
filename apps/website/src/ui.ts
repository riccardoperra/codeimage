import {createRoot} from 'solid-js';
import {createStore} from 'solid-js/store';

interface GlobalUiStore {
  navColor: string | undefined;
}

export function $createUIStore() {
  const [store, setStore] = createStore<GlobalUiStore>({
    navColor: undefined,
  });
  return {
    value: store,
    set: setStore,
  };
}

const uiStore = createRoot($createUIStore);

export function getUiStore() {
  return uiStore;
}
