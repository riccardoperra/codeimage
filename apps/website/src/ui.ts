import {Auth0Client, User} from '@auth0/auth0-spa-js';
import {createRoot, createSignal, onMount} from 'solid-js';
import {createStore} from 'solid-js/store';
import {runOnIdle} from '~/core/hydration/schedule';

interface GlobalUiStore {
  navColor: string | undefined;
}

export function $createUIStore() {
  const [auth, setAuth] = createSignal<Auth0Client>();
  const [user, setUser] = createSignal<User>();
  const [store, setStore] = createStore<GlobalUiStore>({
    navColor: undefined,
  });

  onMount(() => {
    runOnIdle(
      () => {
        import('@auth0/auth0-spa-js').then(async ({createAuth0Client}) => {
          const auth0Client = await createAuth0Client({
            domain: import.meta.env.VITE_PUBLIC_AUTH0_DOMAIN,
            clientId: import.meta.env.VITE_PUBLIC_AUTH0_CLIENT_ID,
            authorizationParams: {
              audience: import.meta.env.VITE_PUBLIC_AUTH0_AUDIENCE,
            },
            cookieDomain: 'codeimage.dev',
            cacheLocation: 'localstorage',
          });
          setAuth(() => auth0Client);
          const authValue = auth();
          if (authValue) {
            authValue
              .getUser()
              .then(user => setUser(user))
              .catch(() => setUser(null));
          }
        });
      },
      200,
      true,
    );
  });

  return {
    value: store,
    set: setStore,
    auth,
    user,
  };
}

const uiStore = createRoot($createUIStore);

export function getUiStore() {
  return uiStore;
}
