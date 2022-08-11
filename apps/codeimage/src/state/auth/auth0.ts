import {User} from '@auth0/auth0-spa-js';
import {auth0} from '@core/constants/auth0';
import {createRoot, createSignal, createResource} from 'solid-js';

type AuthState = User | null;
const env = import.meta.env;

export function $auth0State() {
  //   const [isAuthenticated, setIsAuthenticated] = createSignal<
  //     boolean | undefined
  //   >(undefined);
  //   const [userResource] = createResource(async () => {
  //     const url = getUrl()!;
  //     if (isRedirect(url)) {
  //       const {appState} = await auth0.handleRedirectCallback(url);
  //       onLogin!(appState, env.VITE_PUBLIC_MY_CALLBACK_URL);
  //     }
  //     if (setIsAuthenticated(await auth0.isAuthenticated())) {
  //       const user = await auth0.getUser();
  //       setState(user);
  //       return user;
  //     }
  //   });

  //   function getUrl() {
  //     return window.location.href;
  //   }
  //   function isRedirect(url: string) {
  //     const [, query] = url.split('?');
  //     return query && query.includes('code=') && query.includes('state=');
  //   }
  //   function onLogin(_appState: any, loginRedirectUri: string) {
  //     window.history.replaceState(undefined, '', loginRedirectUri);
  //   }
  //   supabase.auth.onAuthStateChange((event, session) => {
  //     if (event === 'SIGNED_IN' && session) {
  //       setState(session);
  //     }
  //     if (event === 'SIGNED_OUT') {
  //       setState(null);
  //     }
  //   });
  const [state, setState] = createSignal<AuthState>();

  async function login() {
    await auth0.loginWithRedirect({redirectMethod: 'assign'});
    try {
      const user = await auth0.getUser();
      console.log('user', user);
      setState(user);
    } catch {
      console.error('Error getting user');
      setState(null);
    }
  }
  async function getUser() {
    try {
      const user = await auth0.getUser();
      console.log('user', user);
      setState(user);
      return user;
    } catch {
      console.error('Error getting user');
      setState(null);
      return undefined;
    }
  }
  async function isAuth() {
    try {
      const isAuth = await auth0.isAuthenticated();
      console.log('user', isAuth);
      return isAuth;
    } catch {
      console.error('Error getting user');
      return undefined;
    }
  }
  async function signOut() {
    await auth0.logout({returnTo: window.location.origin});
  }

  const loggedIn = () => !!state();

  return {
    user: state,
    login,
    signOut,
    loggedIn,
    isAuth,
    getUser,
  };
}

const auth0State = createRoot($auth0State);

export function getAuth0State() {
  return auth0State;
}
