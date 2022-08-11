import createAuth0Client, {
  LogoutOptions,
  RedirectLoginOptions,
} from '@auth0/auth0-spa-js';
import {
  createContext,
  useContext,
  createResource,
  createSignal,
  JSX,
} from 'solid-js';
import {mergeProps} from 'solid-js/web';
import {Auth0State} from './types';

export const Auth0Context = createContext<Auth0State>();
export const useAuth0 = () => useContext(Auth0Context);

export interface Auth0Props {
  children: JSX.Element;
  domain: string;
  audience?: string;
  clientId: string;
  loginRedirectUri: string;
  logoutRedirectUri: string;
  getUrl?: () => string;
  onLogin?: (appState: any, loginRedirectUri: string) => void;
}

export function Auth0(props: Auth0Props) {
  props = mergeProps(
    {},
    {
      onLogin: onLogin,
      getUrl: getUrl,
    },
    props,
  );

  const auth0ClientPromise = createAuth0Client({
    domain: props.domain,
    client_id: props.clientId,
    redirect_uri: props.loginRedirectUri,
  });

  const [isAuthenticated, setIsAuthenticated] = createSignal<
    boolean | undefined
  >(undefined);

  const [user, setUser] = createSignal();

  const [auth0Client] = createResource(async () => {
    const client = await auth0ClientPromise;
    const url = props.getUrl!();

    if (isRedirect(url)) {
      const {appState} = await client.handleRedirectCallback(url);
      props.onLogin!(appState, props.loginRedirectUri);
    }
    if (setIsAuthenticated(await client.isAuthenticated())) {
      setUser(await client.getUser());
    }

    return client;
  });

  return (
    <Auth0Context.Provider
      value={{
        auth0Client,
        isInitialized: () => isAuthenticated() !== undefined,
        isAuthenticated: () => !!isAuthenticated(),
        user,
        async loginWithRedirect(options?: RedirectLoginOptions) {
          const client = await auth0ClientPromise;
          client.loginWithRedirect({
            redirect_uri: props.loginRedirectUri,
            ...options,
          });
        },
        async logout(options?: LogoutOptions) {
          const client = await auth0ClientPromise;
          client.logout({
            returnTo: props.logoutRedirectUri,
            ...options,
          });
        },
        async getToken() {
          const client = await auth0ClientPromise;
          return await client.getTokenSilently();
        },
      }}
    >
      {props.children}
    </Auth0Context.Provider>
  );
}

function isRedirect(url: string) {
  const [, query] = url.split('?');
  return query && query.includes('code=') && query.includes('state=');
}

function getUrl() {
  return window.location.href;
}

function onLogin(_appState: any, loginRedirectUri: string) {
  window.history.replaceState(undefined, '', loginRedirectUri);
}
