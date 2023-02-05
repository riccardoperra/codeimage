import {untrack} from 'solid-js';
import {reconcile} from 'solid-js/store';
import {makePlugin} from 'statebuilder';

export const withLocalStorage = (storeName: string) => {
  return makePlugin(
    storeApi => {
      // TODO: add plugin storage
      const initialState = localStorage.getItem(storeName);

      if (initialState) {
        try {
          const parsedState = JSON.parse(initialState);
          storeApi.set(reconcile(parsedState));
        } catch {}
      }

      const defaultSet = storeApi.set;

      // TODO: add statebuilder utilities to override set with better typings
      storeApi.set = (...args: unknown[]): void => {
        const result = defaultSet(...(args as Parameters<typeof defaultSet>));
        localStorage.setItem(
          storeName,
          JSON.stringify(untrack(() => storeApi())),
        );
        return result;
      };

      return {};
    },
    {name: 'withLocalStorage'},
  );
};
