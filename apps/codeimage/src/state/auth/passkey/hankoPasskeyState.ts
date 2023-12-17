import {makePersisted} from '@solid-primitives/storage';
import {createStore} from 'solid-js/store';

interface LocalStorage {
  session?: any;
}
export function createPasskeyState(key: string) {
  // eslint-disable-next-line solid/reactivity
  const signal = createStore<LocalStorage>({});
  const [state, setState] = makePersisted(signal, {
    storage: localStorage,
    name: key,
    serialize(state) {
      const data = JSON.stringify(state);
      return window.btoa(encodeURI(encodeURIComponent(data)));
    },
    deserialize(data) {
      try {
        const decoded = decodeURIComponent(decodeURI(window.atob(data)));
        return JSON.parse(decoded);
      } catch (e) {
        return null;
      }
    },
  });

  return {
    value: state,
    setState,
  };
}
