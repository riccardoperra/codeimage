import {Auth0Client, User} from '@auth0/auth0-spa-js';
import {createEffect, createRoot, createSignal, onMount} from 'solid-js';
import {createStore} from 'solid-js/store';

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
    import('@auth0/auth0-spa-js').then(async ({createAuth0Client}) => {
      const auth0Client = await createAuth0Client({
        domain: import.meta.env.VITE_PUBLIC_AUTH0_DOMAIN,
        clientId: import.meta.env.VITE_PUBLIC_AUTH0_CLIENT_ID,
        authorizationParams: {
          audience: import.meta.env.VITE_PUBLIC_AUTH0_AUDIENCE,
        },
        cacheLocation: 'localstorage',
      });
      setAuth(() => auth0Client);
      //if you do this, you'll need to check the session yourself
    });
    createEffect(() => {
      const authValue = auth();
      setTimeout(async () => {
        if (authValue) {
          try {
            await authValue.getTokenSilently();
            console.log('is auth', await authValue.isAuthenticated());
          } catch (error) {
            console.log('error test', error);
            console.log('is auth', await authValue.isAuthenticated());
            if (error.error !== 'login_required') {
              throw error;
            }
          }

          authValue
            .getUser()
            .then(user => {
              return setUser(user);
            })
            .catch(() => null);
        }
      });
    });
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
